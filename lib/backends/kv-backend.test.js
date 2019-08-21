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

    it('handles secrets values that are objects', async () => {
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

    it('handles invalid JSON objects', async () => {
      kvBackend._get.onFirstCall().resolves('{')
      const secretPropertyValues = await kvBackend._fetchSecretPropertyValues({
        externalData: [{
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
        externalData: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }]
      })

      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName1')).to.equal(true)
      expect(loggerMock.info.calledWith('fetching secret property fakePropertyName2')).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey1'
      })).to.equal(true)
      expect(kvBackend._get.calledWith({
        secretKey: 'fakePropertyKey2'
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
        .resolves(['fakePropertyValue1', 'fakePropertyValue2'])

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
        }]
      })).to.equal(true)
      expect(manifestData).deep.equals({
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
      })
    })
  })
})
