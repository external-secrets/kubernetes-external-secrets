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
   * @param {string} key - Key used to store secret property value in Secrets Manager.
   * @param {object} keyOptions - Options for this specific key, eg version etc.
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.roleArn - IAM role arn to assume
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, specOptions: { roleArn } }) {
    this._logger.info(`fetching secret property ${key} with role: ${roleArn || 'pods role'}`)

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
      .getSecretValue({ SecretId: key })
      .promise()

    if ('SecretBinary' in data) {
      return data.SecretBinary
    } else if ('SecretString' in data) {
      return data.SecretString
    }

    this._logger.error(`Unexpected data from Secrets Manager secret ${key}`)
    return null
  }
}

module.exports = SecretsManagerBackend
