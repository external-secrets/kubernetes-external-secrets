/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const KVBackend = require('./kv-backend')

describe('SecretsManagerBackend', () => {
  let loggerMock
  let kvBackend

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    loggerMock.warn = sinon.stub()

    kvBackend = new KVBackend({
      logger: loggerMock
    })
  })

  describe('_fetchSecretPropertyValues', () => {
    beforeEach(() => {
      // NOTE(jdaeli): overriding abstract method _get
      kvBackend._get = sinon.stub()
    })

    it('throws an error if specified property is missing in JSON secret value', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      try {
        await kvBackend._fetchSecretPropertyValues({
          externalData: [{
            key: 'mocked-key',
            name: 'mocked-name',
            property: 'oops'
          }]
        })
        expect.fail('Should not reach')
      } catch (err) {
        expect(err).to.be.an('error')
      }
    })

    it('fetches specified property of a JSON secret value', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
          key: 'mocked-key',
          name: 'mocked-name',
          property: 'foo'
        }]
      })
      expect(secretPropertyValues).to.deep.equal(['bar'])
    })

    it('fetches all properties of a JSON secret value', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar","hello":"world"}')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
          key: 'fakePropertyKey1'
        }]
      })
      expect(secretPropertyValues).to.deep.equal([{ foo: 'bar', hello: 'world' }])
    })

    it('handles invalid JSON secret value', async () => {
      kvBackend._get.onFirstCall().resolves('{')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1',
          property: 'fakePropertyProperty1'
        }]
      })
      expect(secretPropertyValues).to.deep.equal([undefined])
    })

    it('fetches secret property values without a specified role', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')

      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }]
      })

      expect(loggerMock.info.calledWith('fetching secret property fakePropertyKey1 with role: undefined')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey1',
        roleArn: undefined
      })).to.equal(true)
      expect(loggerMock.info.calledWith('fetching secret property fakePropertyKey2 with role: undefined')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey2',
        roleArn: undefined
      })).to.equal(true)
      expect(secretPropertyValues).deep.equals(['fakePropertyValue1', 'fakePropertyValue2'])
    })

    it('fetches secret property values using the specified role', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')

      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        roleArn: 'secretDescriptiorRole'
      })

      expect(loggerMock.info.calledWith('fetching secret property fakePropertyKey1 with role: secretDescriptiorRole')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey1',
        roleArn: 'secretDescriptiorRole'
      })).to.equal(true)
      expect(loggerMock.info.calledWith('fetching secret property fakePropertyKey2 with role: secretDescriptiorRole')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey2',
        roleArn: 'secretDescriptiorRole'
      })).to.equal(true)
      expect(secretPropertyValues).deep.equals(['fakePropertyValue1', 'fakePropertyValue2'])
    })
  })

  describe('_get', () => {
    it('throws an error', () => {
      let error

      try {
        kvBackend._get()
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('_get not implemented')
    })
  })

  describe('getSecretManifestData', () => {
    beforeEach(() => {
      kvBackend._fetchSecretPropertyValues = sinon.stub()
    })

    it('returns secret manifest data', async () => {
      kvBackend._fetchSecretPropertyValues
        .resolves([
          'fakePropertyValue1',
          'fakePropertyValue2',
          'bar',
          'buzz',
          { hello: 'world', howdy: 'do' }
        ])

      const manifestData = await kvBackend
        .getSecretManifestData({
          secretDescriptor: {
            backendType: 'fakeBackendType',
            name: 'fakeSecretName',
            properties: [{
              key: 'fakePropertyKey1',
              name: 'fakePropertyName1'
            }, {
              key: 'fakePropertyKey2',
              name: 'fakePropertyName2'
            }, {
              key: 'fakePropertyKey3',
              name: 'fakePropertyName3',
              property: 'foo'
            }, {
              key: 'fakePropertyKey4',
              property: 'fizz'
            }, {
              key: 'fakePropertyKey5'
            }]
          }
        })

      expect(kvBackend._fetchSecretPropertyValues.calledWith({
        externalData: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }, {
          key: 'fakePropertyKey3',
          name: 'fakePropertyName3',
          property: 'foo'
        }, {
          key: 'fakePropertyKey4',
          property: 'fizz'
        }, {
          key: 'fakePropertyKey5'
        }],
        roleArn: undefined
      })).to.equal(true)
      expect(manifestData).deep.equals({
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy', // base 64 value
        fakePropertyName3: 'YmFy', // base 64 value
        undefined: 'YnV6eg==', // base 64 value
        hello: 'd29ybGQ=', // base 64 value
        howdy: 'ZG8=' // base 64 value
      })
    })
  })
})
