'use strict'

const KVBackend = require('./kv-backend')

/** AliCloud KMS backend class. */
class AliCloudKMSBackend extends KVBackend {
  /**
   * Create AliCloud KMS backend.
   * @param {Object} client - Client for interacting with KMS.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, logger }) {
    super({ logger })
    this._client = client
  }

  /**
   * Get secret property value from KMS.
   * @param {string} key - Key used to store secret property value in KMS.
   * @param {object} keyOptions - Options for this specific key, eg version etc.
   * @param {string} keyOptions.versionStage - Version stage
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, keyOptions: { versionStage = 'ACSCurrent' } }) {
    this._logger.info(`fetching secret ${key} from AliCloud KMS backend`)

    const data = await this._client.request('GetSecretValue', {
      SecretName: key,
      VersionStage: versionStage
    })

    return data.SecretData
  }
}

module.exports = AliCloudKMSBackend
