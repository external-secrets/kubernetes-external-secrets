/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const KVBackend = require('./kv-backend')

describe('kv-backend', () => {
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

  describe('_fetchDataValues', () => {
    beforeEach(() => {
      // NOTE(jdaeli): overriding abstract method _get
      kvBackend._get = sinon.stub()
    })

    it('throws an error if missing a property', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      try {
        await kvBackend._fetchDataValues({
          data: [{
            key: 'mocked-key',
            name: 'mocked-name',
            property: 'oops'
          }],
          specOptions: {}
        })
        expect.fail('Should not reach')
      } catch (err) {
        expect(err).to.be.an('error')
      }
      expect(kvBackend._get.calledOnce).to.equal(true)
      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'mocked-key',
        keyOptions: {},
        specOptions: {}
      })
    })

    it('handles secrets values that are objects', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      const secretPropertyValues = await kvBackend._fetchDataValues({
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
      const secretPropertyValues = await kvBackend._fetchDataValues({
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

      const secretPropertyValues = await kvBackend._fetchDataValues({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        specOptions: {
          passMeAlong: true
        }
      })

      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakePropertyKey1',
        keyOptions: {},
        specOptions: { passMeAlong: true }
      })
      expect(kvBackend._get.getCall(1).args[0]).to.deep.equal({
        key: 'fakePropertyKey2',
        keyOptions: {},
        specOptions: { passMeAlong: true }
      })
      expect(secretPropertyValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
    })

    it('handles binary values', async () => {
      kvBackend._get.onCall(0).resolves('YmluYXJ5Cg==') // base64 of binary
      kvBackend._get.onCall(1).resolves('stringPropertyValue1')
      kvBackend._get.onCall(2).resolves('{"stringPropertyKey2": "stringPropertyValue2", "binaryPropertyKey2": "YmluYXJ5Cg=="}')
      kvBackend._get.onCall(3).resolves('{"stringPropertyKey2": "stringPropertyValue2", "binaryPropertyKey2": "YmluYXJ5Cg=="}')

      const secretPropertyValues = await kvBackend._fetchDataValues({
        data: [{
          key: 'binaryPropertyKey1',
          name: 'binaryPropertyName1',
          isBinary: true
        }, {
          key: 'stringPropertyKey1',
          name: 'stringPropertyName1'
          // isBinary: false
        }, {
          key: 'jsonProperties',
          name: 'stringPropertyName2',
          // isBinary: false,
          property: 'stringPropertyKey2'
        }, {
          key: 'jsonProperties',
          name: 'binaryPropertyName2',
          isBinary: true,
          property: 'binaryPropertyKey2'
        }]
      })

      expect(secretPropertyValues).deep.equals(
        [{ binaryPropertyName1: Buffer.from('YmluYXJ5Cg==', 'base64') }, // base64 of binary (unchanged)
          { stringPropertyName1: 'stringPropertyValue1' },
          { stringPropertyName2: 'stringPropertyValue2' },
          { binaryPropertyName2: Buffer.from('YmluYXJ5Cg==', 'base64') } // base64 of binary (unchanged)
        ])
    })

    it('fetches secret property values using the specified role', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')

      const secretPropertyValues = await kvBackend._fetchDataValues({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })

      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakePropertyKey1',
        keyOptions: {},
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })
      expect(kvBackend._get.getCall(1).args[0]).to.deep.equal({
        key: 'fakePropertyKey2',
        keyOptions: {},
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })
      expect(secretPropertyValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
    })

    it('fetches secret property with version', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')
      kvBackend._get.onSecondCall().resolves('fakePropertyValue2')
      kvBackend._get.onThirdCall().resolves('fakePropertyValue3')

      const secretPropertyValues = await kvBackend._fetchDataValues({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          versionStage: 'AWSPREVIOUS',
          name: 'fakePropertyName2'
        }, {
          key: 'fakePropertyKey3',
          versionId: 'ea9ef8d7-ea54-4a3b-b24b-99510e8d7a3d',
          name: 'fakePropertyName3'
        }],
        specOptions: {}
      })

      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakePropertyKey1',
        keyOptions: {},
        specOptions: {}
      })
      expect(kvBackend._get.getCall(1).args[0]).to.deep.equal({
        key: 'fakePropertyKey2',
        keyOptions: { versionStage: 'AWSPREVIOUS' },
        specOptions: {}
      })
      expect(kvBackend._get.getCall(2).args[0]).to.deep.equal({
        key: 'fakePropertyKey3',
        keyOptions: { versionId: 'ea9ef8d7-ea54-4a3b-b24b-99510e8d7a3d' },
        specOptions: {}
      })
      expect(secretPropertyValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }, { fakePropertyName3: 'fakePropertyValue3' }])
    })
  })

  describe('_fetchDataFromValues', () => {
    beforeEach(() => {
      kvBackend._get = sinon.stub()
    })

    it('handles secrets values that are objects', async () => {
      kvBackend._get.onFirstCall().resolves('{"foo":"bar"}')
      const dataFromValues = await kvBackend._fetchDataFromValues({
        dataFrom: ['mocked-key']
      })
      expect(dataFromValues).to.deep.equal([{ foo: 'bar' }])
    })

    it('handles invalid JSON objects', async () => {
      kvBackend._get.onFirstCall().resolves('{')
      const dataFromValues = await kvBackend._fetchDataFromValues({
        dataFrom: ['mocked-key']
      })
      expect(dataFromValues).to.deep.equal([undefined])
    })

    it('disregards plain values', async () => {
      kvBackend._get.onFirstCall().resolves('fakePropertyValue1')

      const dataFromValues = await kvBackend._fetchDataFromValues({
        dataFrom: ['fakePropertyKey1'],
        specOptions: { passMeAlong: true }
      })

      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakePropertyKey1',
        keyOptions: {},
        specOptions: { passMeAlong: true }
      })
      expect(dataFromValues).deep.equals([undefined])
    })

    it('fetches secret property values using the specified options', async () => {
      kvBackend._get.onFirstCall().resolves('{"fakePropertyName1":"fakePropertyValue1"}')
      kvBackend._get.onSecondCall().resolves('{"fakePropertyName2":"fakePropertyValue2"}')

      const dataFromValues = await kvBackend._fetchDataFromValues({
        dataFrom: ['fakePropertyKey1', 'fakePropertyKey2'],
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })

      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakePropertyKey1',
        keyOptions: {},
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })
      expect(kvBackend._get.getCall(1).args[0]).to.deep.equal({
        key: 'fakePropertyKey2',
        keyOptions: {},
        specOptions: { roleArn: 'secretDescriptiorRole' }
      })
      expect(dataFromValues).deep.equals([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
    })
  })

  describe('_fetchDataFromValuesWithOptions', () => {
    beforeEach(() => {
      kvBackend._get = sinon.stub()
    })
    it('handles secrets with spec and key options', async () => {
      kvBackend._get.onFirstCall().resolves('{"fakePropertyName1":"fakePropertyValue1"}')
      kvBackend._get.onSecondCall().resolves('{"fakePropertyName2":"fakePropertyValue2"}')
      const dataFromValuesWithOptions = await kvBackend._fetchDataFromValuesWithOptions({
        dataFromWithOptions: [{ versionStage: 'AWSCURRENT', key: 'fakeKey1' },
          { versionId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', key: 'fakeKey2' }],
        specOptions: { passMeAlong: true }
      })
      expect(dataFromValuesWithOptions).to.deep.equal([{ fakePropertyName1: 'fakePropertyValue1' }, { fakePropertyName2: 'fakePropertyValue2' }])
      expect(kvBackend._get.getCall(0).args[0]).to.deep.equal({
        key: 'fakeKey1',
        keyOptions: {
          versionStage: 'AWSCURRENT'
        },
        specOptions: { passMeAlong: true }
      })
      expect(kvBackend._get.getCall(1).args[0]).to.deep.equal({
        key: 'fakeKey2',
        keyOptions: {
          versionId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        },
        specOptions: { passMeAlong: true }
      })
    })
    it('handles invalid JSON objects', async () => {
      kvBackend._get.onFirstCall().resolves('{')
      const dataFromValuesWithOptions = await kvBackend._fetchDataFromValuesWithOptions({
        dataFromWithOptions: [{ key: 'fakeKey1' }]
      })
      expect(dataFromValuesWithOptions).to.deep.equal([undefined])
    })
  })

  describe('_get', () => {
    it('throws an error', () => {
      let error

      try {
        kvBackend._get({})
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('_get not implemented')
    })
  })

  describe('getSecretManifestData', () => {
    beforeEach(() => {
      kvBackend._fetchDataValues = sinon.stub().resolves([])
      kvBackend._fetchDataFromValues = sinon.stub().resolves([])
    })

    it('returns secret manifest data', async () => {
      kvBackend._fetchDataValues
        .resolves([{
          fakePropertyName0: 'should-be-overriden',
          fakePropertyName1: 'fakePropertyValue1'
        }, {
          fakePropertyName0: 'fakePropertyValue0',
          fakePropertyName2: 'fakePropertyValue2'
        }, undefined])
      kvBackend._fetchDataFromValues
        .resolves([{
          fakePropertyName2: 'should-be-overriden', // Overriden by data
          fakePropertyName3: 'fakePropertyValue3', // not overriden
          fakePropertyName4: 'should-be-overriden' // Overriden by secondary dataFrom
        }, undefined, {
          fakePropertyName4: 'fakePropertyValue4',
          fakePropertyName5: 'fakePropertyValue5' // not overriden
        }])

      const manifestData = await kvBackend
        .getSecretManifestData({
          spec: { }
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

    it('handles undefined data', async () => {
      kvBackend._fetchDataValues.resolves([undefined])
      kvBackend._fetchDataFromValues.resolves([undefined])

      const manifestData = await kvBackend
        .getSecretManifestData({ spec: { } })

      expect(manifestData).deep.equals({})
    })

    it('makes correct calls - with data, role and region', async () => {
      await kvBackend.getSecretManifestData({
        spec: {
          data: [
            {
              key: 'fakePropertyKey1',
              name: 'fakePropertyName1'
            }, {
              key: 'fakePropertyKey2',
              name: 'fakePropertyName2'
            }
          ],
          roleArn: 'my-role',
          region: 'my-region'
        }
      })

      expect(kvBackend._fetchDataValues.calledWith({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        specOptions: {
          roleArn: 'my-role',
          region: 'my-region'
        }
      })).to.equal(true)

      expect(kvBackend._fetchDataFromValues.calledWith({
        dataFrom: [],
        specOptions: {
          roleArn: 'my-role',
          region: 'my-region'
        }
      })).to.equal(true)
    })

    it('makes correct calls - with properties and dataFrom', async () => {
      await kvBackend.getSecretManifestData({
        spec: {
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
          ],
          roleArn: 'this-should-be-passed-along',
          magicSetting: 'this as well'
        }
      })

      expect(kvBackend._fetchDataValues.getCall(0).args[0]).to.deep.equal({
        data: [{
          key: 'fakePropertyKey1',
          name: 'fakePropertyName1'
        }, {
          key: 'fakePropertyKey2',
          name: 'fakePropertyName2'
        }],
        specOptions: {
          roleArn: 'this-should-be-passed-along',
          magicSetting: 'this as well'
        }
      })

      expect(kvBackend._fetchDataFromValues.calledWith({
        dataFrom: ['fakeDataFromKey1'],
        specOptions: {
          roleArn: 'this-should-be-passed-along',
          magicSetting: 'this as well'
        }
      })).to.equal(true)
    })

    it('makes correct calls - with only dataFrom', async () => {
      await kvBackend.getSecretManifestData({
        spec: {
          dataFrom: [
            'fakeDataFromKey1',
            'fakeDataFromKey2'
          ]
        }
      })

      expect(kvBackend._fetchDataValues.getCall(0).args[0]).to.deep.equal({
        data: [],
        specOptions: { }
      })

      expect(kvBackend._fetchDataFromValues.getCall(0).args[0]).to.deep.equal({
        dataFrom: ['fakeDataFromKey1', 'fakeDataFromKey2'],
        specOptions: { }
      })
    })

    it('do not skew binary data', async () => {
      kvBackend._fetchDataValues
        .resolves([{
          textProperty: 'text',
          binaryProperty: Buffer.from('test', 'utf-8'),
          binaryProperty2: Buffer.from([0xEFBFBDEF, 2, 3])
        }])

      const manifestData = await kvBackend
        .getSecretManifestData({
          spec: { }
        })

      expect(manifestData).deep.equals({
        textProperty: 'dGV4dA==', // base 64 value of text
        binaryProperty: 'dGVzdA==', // base 64 value of test
        binaryProperty2: '7wID' // base 64 value of binary data
      })
    })
  })

  describe('base64 encoding', () => {
    beforeEach(() => {
      kvBackend._get = sinon.stub()
    })

    it('handles json objects', async () => {
      kvBackend._get
        .resolves(JSON.stringify({
          textProperty: 'text',
          jsonStringProperty: '{ "someKey": { "myText": "text" } }',
          jsonProperty: { someKey: { myText: 'text' } }
        }))

      const manifestData = await kvBackend
        .getSecretManifestData({
          spec: {
            dataFrom: ['test-key']
          }
        })

      expect(kvBackend._get.calledOnce).to.equal(true)

      expect(manifestData).deep.equals({
        textProperty: 'dGV4dA==', // base 64 value of text
        jsonStringProperty: 'eyAic29tZUtleSI6IHsgIm15VGV4dCI6ICJ0ZXh0IiB9IH0=', // base 64 value of: { "someKey": { "myText": "text" } }
        jsonProperty: 'eyJzb21lS2V5Ijp7Im15VGV4dCI6InRleHQifX0=' // base 64 value of: {"someKey":{"myText":"text"}}
      })
    })

    it('handles different types of binary data returned by backends', async () => {
      kvBackend._get.onCall(0).resolves(Buffer.from('YmluYXJ5Cg==', 'base64')) // base64 of binary as a Buffer
      kvBackend._get.onCall(1).resolves(Buffer.from('YmluYXJ5Cg==', 'base64')) // base64 of binary as a Buffer
      kvBackend._get.onCall(2).resolves('YmluYXJ5Cg==') // base64 of binary as String
      kvBackend._get.onCall(3).resolves('test')
      // e.g. AWS Secrets Manager will return `SecretBinary` as a Buffer and `SecretString` as a String

      const manifestData = await kvBackend.getSecretManifestData({
        spec: {
          data: [{
            key: 'binaryPropertyKey1',
            name: 'binaryPropertyName1',
            isBinary: true
          }, {
            key: 'binaryPropertyKey2',
            name: 'binaryPropertyName2'
            // isBinary: false, but will have no impact if the backend returns a Buffer
          }, {
            key: 'stringPropertyKey3',
            name: 'stringPropertyName3'
            // isBinary: false,
            // must be set to true to ensure base64-encoded string in the backend
            // is not encoded in base64 again
          }, {
            key: 'stringPropertyKey4',
            name: 'stringPropertyName4',
            isBinary: false // explicitly set false
          }]
        }
      })

      expect(manifestData).deep.equals({
        binaryPropertyName1: 'YmluYXJ5Cg==', // base64 of binary (unchanged)
        binaryPropertyName2: 'YmluYXJ5Cg==', // base64 of binary (unchanged)
        stringPropertyName3: 'WW1sdVlYSjVDZz09', // base64 of base64 of binary
        stringPropertyName4: 'dGVzdA==' // base64 of test
      })
    })
  })
})
