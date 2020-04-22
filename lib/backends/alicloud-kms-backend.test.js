/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const AliCloudKMSBackend = require('./alicloud-kms-backend')

describe('AliCloudKMSBackend', () => {
  let loggerMock
  let clientMock
  let alicloudKMSBackend

  const data = {
    SecretName: 'some-key',
    SecretData: 'some-secret'
  }

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientMock = sinon.mock()
    clientMock.request = sinon.stub().returns(data)

    alicloudKMSBackend = new AliCloudKMSBackend({
      client: clientMock,
      logger: loggerMock
    })
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const secretPropertyValue = await alicloudKMSBackend._get({
        key: 'some-key',
        keyOptions: { versionStage: 'some-version' }
      })
      expect(
        clientMock.request.calledWith('GetSecretValue', {
          SecretName: 'some-key',
          VersionStage: 'some-version'
        })
      ).to.equal(true)
      expect(secretPropertyValue).equals('some-secret')
    })
  })
})
