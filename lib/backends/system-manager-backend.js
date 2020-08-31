'use strict'

const KVBackend = require('./kv-backend')

/** System Manager backend class. */
class SystemManagerBackend extends KVBackend {
  /**
   * Create System Manager backend.
   * @param {Object} client - Client for interacting with System Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ clientFactory, assumeRole, logger }) {
    super({ logger })
    this._client = clientFactory()
    this._clientFactory = clientFactory
    this._assumeRole = assumeRole
  }

  /**
   * Get secret property value from System Manager.
   * @param {string} key - Key used to store secret property value in System Manager.
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.roleArn - IAM role arn to assume
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, specOptions: { roleArn, region } }) {
    this._logger.info(`fetching secret property ${key} with role: ${roleArn || 'pods role'} in region ${region}`)

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
    try {
      const data = await client
        .getParameter({
          Name: key,
          WithDecryption: true
        })
        .promise()
      return data.Parameter.Value
    } catch (err) {
      if (err.code === 'ParameterNotFound' && (!err.message || err.message === 'null')) {
        err.message = `ParameterNotFound: ${key} could not be found.`
      }

      throw err
    }
  }
}

module.exports = SystemManagerBackend
