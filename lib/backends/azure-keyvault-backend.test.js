/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const AzureKeyVaultBackend = require('./azure-keyvault-backend')

describe('AzureKeyVaultBackend', () => {
  let credentialMock
  let loggerMock
  let credentialFactoryMock
  let clientMock
  let azureKeyVaultBackend
  const secret = 'fakeSecretPropertyValue'
  const key = 'password'
  const keyVaultName = 'vault_name'
  const quotedSecretValueAsBase64 = Buffer.from(secret).toString('base64')

  const azureSecret = {
    properties: {},
    value: secret,
    name: key
  }

  beforeEach(() => {
    credentialMock = sinon.mock()
    loggerMock = sinon.mock()
    credentialFactoryMock = sinon.fake.returns(credentialMock)
    clientMock = sinon.mock()
    clientMock.getSecret = sinon.stub().returns(azureSecret)
    loggerMock.info = sinon.stub()

    azureKeyVaultBackend = new AzureKeyVaultBackend({
      credential: credentialFactoryMock,
      logger: loggerMock
    })
    azureKeyVaultBackend._keyvaultClient = sinon.stub().returns(clientMock)
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const secretPropertyValue = await azureKeyVaultBackend._get({
        key: key,
        specOptions: {
          keyVaultName: keyVaultName
        }
      })
      expect(secretPropertyValue).equals(secret)
    })
  })

  describe('getSecretManifestData', () => {
    it('returns secret property value', async () => {
      const returnedData = await azureKeyVaultBackend.getSecretManifestData({
        spec: {
          backendType: 'vault',
          keyVaultName: keyVaultName,
          data: [{
            key: key,
            name: 'name-in-k8s'
          }]
        }
      })

      // First, we get the client...
      sinon.assert.calledWith(azureKeyVaultBackend._keyvaultClient, { keyVaultName })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.getSecret, key)

      // ... and expect to get the full proper value
      expect(returnedData['name-in-k8s']).equals(quotedSecretValueAsBase64)
    })
  })
})
