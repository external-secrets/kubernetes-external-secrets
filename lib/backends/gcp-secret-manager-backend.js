'use strict'

const KVBackend = require('./kv-backend')

/** GCP Secrets Manager backend class. */
class GCPSecretManagerBackend extends KVBackend {
  /**
   * @param {Object} client - GCP Secret Manager Client.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, logger }) {
    super({ logger })
    this._client = client
  }

  /**
   * Get secret value from GCP Secret Manager.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get (key) {
	// get the project id from client
	const projectId = this._client.auth._cachedProjectId;

	const [secret] = await this._client.accessSecretVersion({
		name: 'projects/' + projectId + '/secrets/' + key.key + '/versions/latest',
	});

	console.log("secret created successfully for key [" + key.key + "]");

	const responsePayload = secret.payload.data.toString('utf8');
	return responsePayload;
  }
}

module.exports = GCPSecretManagerBackend
