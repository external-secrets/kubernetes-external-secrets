'use strict'

const KVBackend = require('./kv-backend')

/** GCP Secrets Manager backend class. */
class GCPSecretsManagerBackend extends KVBackend {
  /**
   * Create Secrets manager backend.
   * @param {Object} logger - Logger for logging stuff.
   * @param {Object} client - Secrets manager client.
   */
  constructor ({ logger, client }) {
    super({ logger })
    this._client = client
  }

  /**
   * Get secret property value from GCP Secrets Manager.
   * @param {string} key - Key used to store secret property value in GCP Secrets Manager.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, keyOptions }) {
    this._logger.info(`fetching secret ${key} from GCP Secret Manager`)
    const version = await this._client.accessSecretVersion({
      name: key
    })
    const secret = { value: version[0].payload.data.toString('utf8') }
    // Handle binary files - this is useful when you've stored a base64 encoded string
    if (keyOptions && keyOptions.isBinary) {
      return Buffer.from(secret.value, 'base64')
    }
    return JSON.stringify(secret)
  }
}

module.exports = GCPSecretsManagerBackend
