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
  const quotedSecretValue = '"' + secret + '"'

  beforeEach(() => {
    credentialMock = sinon.mock()
    loggerMock = sinon.mock()
    credentialFactoryMock = sinon.fake.returns(credentialMock)
    clientMock = sinon.mock()
    loggerMock.info = sinon.stub()

    azureKeyVaultBackend = new AzureKeyVaultBackend({
      credential: credentialFactoryMock,
      logger: loggerMock
    })
    azureKeyVaultBackend._keyvaultClient = sinon.stub().returns(clientMock)
  })

  describe('_get', () => {
    beforeEach(() => {
      clientMock.getSecret = sinon.stub().returns(secret)
    })

    it('returns secret property value', async () => {
      const secretPropertyValue = await azureKeyVaultBackend._get({
        key: key,
        specOptions: {
          keyVaultName: keyVaultName
        }
      })
      expect(secretPropertyValue).equals(quotedSecretValue)
    })
  })
})
