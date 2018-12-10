'use strict';

const KVBackend = require('./kv-backend');

/** Secrets Manager backend class. */
class SecretsManagerBackend extends KVBackend {
  /**
   * Create Secrets Manager backend.
   * @param {Object} client - Client for interacting with Secrets Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor({ client, logger }) {
    super({ logger });
    this._client = client;
  }

  /**
   * Get secret property value from Secrets Manager.
   * @param {string} secretKey - Key used to store secret property value in Secrets Manager.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get({ secretKey }) {
    const data = await this._client
      .getSecretValue({ SecretId: secretKey })
      .promise();

    // NOTE(jdaeli): data.SecretString can also be valid key/value serialized object
    // but for compatibility with System Manager, we store a single string value
    return data.SecretString;
  }
}

module.exports = SecretsManagerBackend;
