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

  /**
   * Get secret property value from System Manager.
   * @param {string} path - Key used to store secret property value in System Manager.
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.roleArn - IAM role arn to assume
   * @returns {Promise} Promise object representing secret property value.
   */
  async _getByPath ({ path, keyOptions, specOptions: { roleArn, region } }) {
    let client = this._client
    let factoryArgs = null
    const recursive = keyOptions.recursive || false

    this._logger.info(`fetching all secrets ${recursive ? '(recursively)' : ''} inside path ${path} with role ${roleArn !== ' from pod'} in region ${region}`)

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
      const getAllParameters = async () => {
        const EMPTY = Symbol('empty')
        this._logger.info(`fetching parameters for path ${path}`)
        const res = []
        for await (const lf of (async function * () {
          let NextToken = EMPTY
          while (NextToken || NextToken === EMPTY) {
            const parameters = await client.getParametersByPath({
              Path: path,
              WithDecryption: true,
              Recursive: recursive,
              NextToken: NextToken !== EMPTY ? NextToken : undefined
            }).promise()
            yield * parameters.Parameters
            NextToken = parameters.NextToken
          }
        })()) {
          res.push(lf)
        }
        return res
      }

      const parameters = {}
      const ssmData = await getAllParameters()
      for (const ssmRecord in ssmData) {
        const paramName = require('path').basename(ssmData[String(ssmRecord)].Name)
        const paramValue = ssmData[ssmRecord].Value
        parameters[paramName] = paramValue
      }

      return parameters
    } catch (err) {
      if (err.code === 'ParameterNotFound' && (!err.message || err.message === 'null')) {
        err.message = `ParameterNotFound: ${path} could not be found.`
      }

      throw err
    }
  }
}

module.exports = SystemManagerBackend
