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
    return this._client.auth.getProjectId()
  }

  /**
   * Get secret property value from GCP Secrets Manager.
   * @param {string} key - Key used to store secret property value in GCP Secrets Manager.
   * @param {string} specOptions.projectId - Id of the gcp project, if not passed, this will be fetched from the client auth
   * @param {string} keyOptions.version - If version is passed then fetch that version, else fetch the latest version
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, keyOptions, specOptions: { projectId } }) {
    if (!projectId) {
      // get the project id from client
      projectId = await this._getProjectId()
    }

    let secretVersion = 'latest'
    if (keyOptions && keyOptions.version) {
      secretVersion = keyOptions.version
    }

    this._logger.info(`fetching secret ${key} from GCP Secret for project ${projectId} with version ${secretVersion}`)

    const [version] = await this._client.accessSecretVersion({
      name: 'projects/' + projectId + '/secrets/' + key + '/versions/' + secretVersion
    })
    return version.payload.data.toString('utf8')
  }
}

module.exports = GCPSecretsManagerBackend
