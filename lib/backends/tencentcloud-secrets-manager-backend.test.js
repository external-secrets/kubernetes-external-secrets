/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const TencentCloudSecretsManagerBackend = require('./tencentcloud-secrets-manager-backend')

describe('TencentCloudSecretsManagerBackend', () => {
  let loggerMock
  let clientMock
  let tencentCloudSecretsManagerBackend

  const password = 'fakeSecretPropertyValue'
  const secret = {
    SecretString: password
  }
  const key = 'password'

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientMock = sinon.mock()
    clientMock.GetSecretValue = sinon.stub().returns(secret)

    tencentCloudSecretsManagerBackend = new TencentCloudSecretsManagerBackend({
      credential: null,
      logger: loggerMock
    })
    tencentCloudSecretsManagerBackend._getClient = sinon.stub().returns(clientMock)
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const specOptions = {}
      const keyOptions = {}
      const secretPropertyValue = await tencentCloudSecretsManagerBackend._get({
        key: key,
        specOptions,
        keyOptions
      })
      expect(secretPropertyValue).equals(password)
    })
  })
})
