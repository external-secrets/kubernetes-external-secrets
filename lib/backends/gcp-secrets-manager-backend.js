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
  * Gets the project id from auth object from the GCP Secret Manager Client
  */
  _getProjectId () {
    return this._client.auth._cachedProjectId
  }

  /**
   * Get secret property value from GCP Secrets Manager.
   * @param {string} key - Key used to store secret property value in Azure Key Vault.
   * @param {string} specOptions.projectId - Id of the gcp project, if not passed, this will be fetched from the client auth
   * @param {string} keyOptions.version - If version is passed then fetch that version, else fetch the latest version
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, keyOptions, specOptions: { projectId } }) {
    if (!projectId) {
      // get the project id from client
      projectId = this._getProjectId()
    }

    let secretVersion
    if (!keyOptions || !keyOptions.version) {
      // get the latest version
      secretVersion = 'latest'
    } else {
      secretVersion = keyOptions.version
    }

    this._logger.info(`fetching secret ${key} from GCP Secret for project ${projectId} with version ${secretVersion}`)

    const version = await this._client.accessSecretVersion({
      name: 'projects/' + projectId + '/secrets/' + key + '/versions/' + secretVersion
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
