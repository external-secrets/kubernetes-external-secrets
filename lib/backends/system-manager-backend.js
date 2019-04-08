'use strict'

const KVBackend = require('./kv-backend')

/** System Manager backend class. */
class SystemManagerBackend extends KVBackend {
  /**
   * Create System Manager backend.
   * @param {Object} client - Client for interacting with System Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, logger }) {
    super({ logger })
    this._client = client
  }

  /**
   * Get secret property value from System Manager.
   * @param {string} secretKey - Key used to store secret property value in System Manager.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ secretKey }) {
    const data = await this._client
      .getParameter({
        Name: secretKey,
        WithDecryption: true
      })
      .promise()
    return data.Value
  }
}

module.exports = SystemManagerBackend
