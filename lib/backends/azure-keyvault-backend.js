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
    this._credential = credential
  }

  _keyvaultClient ({ keyVaultName }) {
    const url = `https://${keyVaultName}.vault.azure.net`
    const client = new SecretClient(url, this._credential)
    return client
  }

  /**
   * Get secret property value from Azure Key Vault.
   * @param {string} key - Key used to store secret property value in Azure Key Vault.
   * @param {string} specOptions.keyVaultName - Name of the azure key vault
   * @param {string} keyOptions.isBinary - Does the secret contain a binary? Set to "true" to handle as binary. Does not work with "property"
   * @returns {Promise} Promise object representing secret property value.
   */

  async _get ({ key, keyOptions, specOptions: { keyVaultName } }) {
    const client = this._keyvaultClient({ keyVaultName })
    this._logger.info(`fetching secret ${key} from Azure KeyVault ${keyVaultName}`)
    const secret = await client.getSecret(key)
    // Handle binary files, since the Azure client does not
    if (keyOptions && keyOptions.isBinary) {
      return Buffer.from(secret.value, 'base64')
    }
    return secret.value
  }
}

module.exports = AzureKeyVaultBackend
