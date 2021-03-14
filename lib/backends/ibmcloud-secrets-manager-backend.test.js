/* eslint-env mocha */
'use strict'

process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE = 'noauth'
process.env.IBM_CLOUD_SECRETS_MANAGER_API_APIKEY = 'iamkey'

const { expect } = require('chai')
const sinon = require('sinon')

const IbmCloudSecretsManagerBackend = require('./ibmcloud-secrets-manager-backend')

describe('IbmCloudSecretsManagerBackend', () => {
  let loggerMock
  let clientMock
  let ibmCloudSecretsManagerBackend

  const username = 'fakeUserName'
  const password = 'fakeSecretPropertyValue'
  const secret = { result: { resources: [{ secret_data: { password: password, username: username } }] } }
  const returnsecret = JSON.stringify({ password: password, username: username })
  const key = 'username_password'

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientMock = sinon.mock()
    clientMock.getSecret = sinon.stub().returns(secret)

    ibmCloudSecretsManagerBackend = new IbmCloudSecretsManagerBackend({
      credential: { endpoint: 'https//sampleendpoint' },
      logger: loggerMock
    })
    ibmCloudSecretsManagerBackend._secretsManagerClient = sinon.stub().returns(clientMock)
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const specOptions = {}
      const keyOptions = { secretType: 'password' }
      const secretPropertyValue = await ibmCloudSecretsManagerBackend._get({
        key: key,
        specOptions,
        keyOptions
      })
      console.log(secretPropertyValue)
      expect(secretPropertyValue).equals(returnsecret)
    })
  })
})
