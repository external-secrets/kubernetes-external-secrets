'use strict'

const KVBackend = require('./kv-backend')

/** Secrets Manager backend class. */
class SecretsManagerBackend extends KVBackend {
  /**
   * Create Secrets Manager backend.
   * @param {Object} client - Client for interacting with Secrets Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ clientFactory, assumeRole, logger }) {
    super({ logger })
    this._client = clientFactory()
    this._clientFactory = clientFactory
    this._assumeRole = assumeRole
  }

  /**
   * Get secret property value from Secrets Manager.
   * @param {string} secretKey - Key used to store secret property value in Secrets Manager.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ secretKey, roleArn }) {
    let client = this._client
    if (roleArn) {
      const res = await this._assumeRole({
        RoleArn: roleArn,
        RoleSessionName: 'k8s-external-secrets'
      })
      client = this._clientFactory({
        accessKeyId: res.Credentials.AccessKeyId,
        secretAccessKey: res.Credentials.SecretAccessKey,
        sessionToken: res.Credentials.SessionToken
      })
    }

    const data = await client
      .getSecretValue({ SecretId: secretKey })
      .promise()

    return data.SecretString
  }
}

module.exports = SecretsManagerBackend
