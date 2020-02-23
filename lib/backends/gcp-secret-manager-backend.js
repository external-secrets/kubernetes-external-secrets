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
  async _get () {
  	console.log("Getting secrets from secret manager");

	//TODO: get the list of secrets to be fetched from Secret Manager
    const [secret] = await this._client.accessSecretVersion({
      name: 'projects/aeriscom-ab-dev-201907-2/secrets/new-secret/versions/3',
    });

	console.log("secrets retrieved successfully");

    const responsePayload = secret.payload.data.toString('utf8');
    return responsePayload;
  }
}

module.exports = GCPSecretManagerBackend
