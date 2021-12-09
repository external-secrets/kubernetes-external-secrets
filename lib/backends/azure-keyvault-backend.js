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
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, specOptions: { keyVaultName } }) {
    const client = this._keyvaultClient({ keyVaultName })
    this._logger.info(`fetching secret ${key} from Azure KeyVault ${keyVaultName}`)
    const secret = await client.getSecret(key)
    return secret.value
  }

  /**
   * Get secret values from Azure Key Vault path (`secrets`, `keys`, `certificates`).
   * @param {string} path - Only `secrets` is supported at the moment
   * @param {string} specOptions.keyVaultName - Name of the azure key vault
   * @returns {Promise} Promise object representing secret property value.
   */
  async _getByPath ({ path, specOptions: { keyVaultName } }) {
    if (path !== 'secrets') {
      throw new Error(`Wrong path ${path}. Only 'secrets' path is supported`)
    }
    const client = this._keyvaultClient({ keyVaultName })
    this._logger.info(`fetching all secrets from Azure KeyVault ${keyVaultName}`)

    let all_secrets = {}
    for await (let secretProperties of client.listPropertiesOfSecrets()) {
      let key = secretProperties.name
      let secret = await client.getSecret(key)
      this._logger.info(`fetching key: ${key}`)
      all_secrets[key] = secret.value
    }
    return all_secrets
  }

}

module.exports = AzureKeyVaultBackend
