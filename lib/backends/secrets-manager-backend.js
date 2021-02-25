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
   * @param {string} keyOptions.versionStage - Version stage
   * @param {string} keyOptions.versionId - Version ID
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.roleArn - IAM role arn to assume
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, specOptions: { roleArn, region }, keyOptions: { versionStage = 'AWSCURRENT', versionId = null } }) {
    this._logger.info(`fetching secret property ${key} with role: ${roleArn || 'pods role'} in region: ${region || 'pods region'}`)

    let client = this._client
    let factoryArgs = null
    if (roleArn) {
      const credentials = this._assumeRole({
        RoleArn: roleArn,
        RoleSessionName: 'k8s-external-secrets'
      })
      factoryArgs = {
        ...factoryArgs,
        credentials
      }
    }
    if (region) {
      factoryArgs = {
        ...factoryArgs,
        region
      }
    }
    if (factoryArgs) {
      client = this._clientFactory(factoryArgs)
    }
    let params
    if (versionId) {
      params = { SecretId: key, VersionId: versionId }
    } else {
      params = { SecretId: key, VersionStage: versionStage }
    }

    const data = await client
      .getSecretValue(params)
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
