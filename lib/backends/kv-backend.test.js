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

    it('throws an error if missing a property', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      try {
        await kvBackend._fetchSecretPropertyValues({
          data: [{
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

    it('handles secrets values that are objects', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        data: [{
          key: 'mocked-key',
          name: 'mocked-name',
          property: 'foo'
        }]
      })
      expect(secretPropertyValues).to.deep.equal([{ 'mocked-name': 'bar' }])
    })

    it('handles invalid JSON objects', async () => {
      kvBackend._get.onFirstCall().resolves('{')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        data: [{
          key: 'mocked-key',
          name: 'mocked-name',
          property: 'foo'
        }]
      })
      expect(secretPropertyValues).to.deep.equal([undefined])
    })

    it('fetches secret property values', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')

      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }]
      })

      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName1 with role: no role set')).to.equal(true)
      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName2 with role: no role set')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey1',
        roleArn: undefined
      })).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey2',
        roleArn: undefined
      })).to.equal(true)
      expect(secretPropertyValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
    })

    it('fetches secret property values using the specified role', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')

      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        roleArn: 'secretDescriptiorRole'
      })

      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName1 with role: secretDescriptiorRole')).to.equal(true)
      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName2 with role: secretDescriptiorRole')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey1',
        roleArn: 'secretDescriptiorRole'
      })).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey2',
        roleArn: 'secretDescriptiorRole'
      })).to.equal(true)
      expect(secretPropertyValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
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
      kvBackend._fetchSecretPropertyValues = sinon.stub().resolves([])
      kvBackend._fetchSecretPropertyValuesFrom = sinon.stub().resolves([])
    })

    it('returns secret manifest data', async () => {
      kvBackend._fetchSecretPropertyValues
        .resolves([{
          fakePropertyName0: 'should-be-overriden',
          fakePropertyName1: 'fakePropertyValue1'
        }, {
          fakePropertyName0: 'fakePropertyValue0',
          fakePropertyName2: 'fakePropertyValue2'
        }])
      kvBackend._fetchSecretPropertyValuesFrom
        .resolves([{
          fakePropertyName2: 'should-be-overriden', // Overriden by data
          fakePropertyName3: 'fakePropertyValue3', // not overriden
          fakePropertyName4: 'should-be-overriden' // Overriden by secondary dataFrom
        }, {
          fakePropertyName4: 'fakePropertyValue4',
          fakePropertyName5: 'fakePropertyValue5' // not overriden
        }])

      const manifestData = await kvBackend
        .getSecretManifestData({
          secretDescriptor: { }
        })

      expect(manifestData).deep.equals({
        fakePropertyName0: 'ZmFrZVByb3BlcnR5VmFsdWUw', // base 64 value of fakePropertyValue0
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value of fakePropertyValue1
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy', // base 64 value of fakePropertyValue2
        fakePropertyName3: 'ZmFrZVByb3BlcnR5VmFsdWUz', // base 64 value of fakePropertyValue3
        fakePropertyName4: 'ZmFrZVByb3BlcnR5VmFsdWU0', // base 64 value of fakePropertyValue4
        fakePropertyName5: 'ZmFrZVByb3BlcnR5VmFsdWU1' // base 64 value of fakePropertyValue5
      })
    })

    it('makes correct calls - with data and role', async () => {
      await kvBackend.getSecretManifestData({
        secretDescriptor: {
          data: [
            {
              key: 'fakePropertyKey1',
              name: 'fakePropertyName1'
            }, {
              key: 'fakePropertyKey2',
              name: 'fakePropertyName2'
            }
          ],
          roleArn: 'my-role'
        }
      })

      expect(kvBackend._fetchSecretPropertyValues.calledWith({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        roleArn: 'my-role'
      })).to.equal(true)

      expect(kvBackend._fetchSecretPropertyValuesFrom.calledWith({
        dataFrom: [],
        roleArn: 'my-role'
      })).to.equal(true)
    })

    it('makes correct calls - with properties and dataFrom', async () => {
      await kvBackend.getSecretManifestData({
        secretDescriptor: {
          properties: [
            {
              key: 'fakePropertyKey1',
              name: 'fakePropertyName1'
            }, {
              key: 'fakePropertyKey2',
              name: 'fakePropertyName2'
            }
          ],
          dataFrom: [
            'fakeDataFromKey1'
          ]
        }
      })

      expect(kvBackend._fetchSecretPropertyValues.calledWith({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        roleArn: undefined
      })).to.equal(true)

      expect(kvBackend._fetchSecretPropertyValuesFrom.calledWith({
        dataFrom: ['fakeDataFromKey1'],
        roleArn: undefined
      })).to.equal(true)
    })
    it('makes correct calls - with only dataFrom', async () => {
      await kvBackend.getSecretManifestData({
        secretDescriptor: {
          dataFrom: [
            'fakeDataFromKey1',
            'fakeDataFromKey2'
          ]
        }
      })

      expect(kvBackend._fetchSecretPropertyValues.calledWith({
        data: [],
        roleArn: undefined
      })).to.equal(true)

      expect(kvBackend._fetchSecretPropertyValuesFrom.calledWith({
        dataFrom: ['fakeDataFromKey1', 'fakeDataFromKey2'],
        roleArn: undefined
      })).to.equal(true)
    })
  })
})
