/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const AliCloudSecretsManagerBackend = require('./alicloud-secrets-manager-backend')

describe('AliCloudSecretsManagerBackend', () => {
  let loggerMock
  let clientMock
  let aliCloudSecretsManagerBackend

  const password = 'fakeSecretPropertyValue'
  const secret = {
    secretData: password
  }
  const key = 'password'

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientMock = sinon.mock()
    clientMock.getSecretValue = sinon.stub().returns(secret)

    aliCloudSecretsManagerBackend = new AliCloudSecretsManagerBackend({
      credential: null,
      logger: loggerMock
    })
    aliCloudSecretsManagerBackend._getClient = sinon.stub().returns(clientMock)
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const specOptions = {}
      const keyOptions = {}
      const secretPropertyValue = await aliCloudSecretsManagerBackend._get({
        key: key,
        specOptions,
        keyOptions
      })
      expect(secretPropertyValue).equals(password)
    })
  })
})
