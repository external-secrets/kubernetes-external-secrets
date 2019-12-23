'use strict'

const { SecretClient } = require('@azure/keyvault-secrets')

const KVBackend = require('./kv-backend')

/** Secrets Manager backend class. */
class AzureKeyVaultBackend extends KVBackend {
  /**
   * Create Key Vault backend.
   * @param {Object} credential - Credentials for authenticating with Azure Key Vault.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ credential, logger }) {
    super({ logger })
    this.credential = credential()
  }

  _keyvaultClient ({ keyVaultName }) {
    const url = `https://${keyVaultName}.vault.azure.net`
    this._logger.info(`${keyVaultName}`)
    const client = new SecretClient(url, this.credential)
    return client
  }

  /**
   * Get secret property value from Azure Key Vault.
   * @param {string} key - Key used to store secret property value in Azure Key Vault.
   * @param {string} specOptions.keyVaultName - Name of the azure key vault
   * @returns {Promise} Promise object representing secret property value.
   */

  async _get ({ key, specOptions: { keyVaultName } }) {
    const client = this._keyvaultClient({ keyVaultName })
    this._logger.info(`fetching secret ${key}`)
    const secret = await client.getSecret(key)
    return JSON.stringify(secret)
  }
}

module.exports = AzureKeyVaultBackend
