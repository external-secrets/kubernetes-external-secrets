'use strict'

const KVBackend = require('./kv-backend')

/** System Manager backend class. */
class SystemManagerBackendbyPath extends KVBackend {

  /**
   * Create System Manager backend.
   * @param {Object} client - Client for interacting with System Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor({ clientFactory, assumeRole, logger }) {
    super({ logger })
    this._client = clientFactory()
    this._clientFactory = clientFactory
    this._assumeRole = assumeRole
  }


  /**
   * Get secret property value from System Manager.
   * @param {string} path - Key used to store secret property value in System Manager.
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.roleArn - IAM role arn to assume
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get({ path = '', specOptions: { roleArn } }) {

    this._logger.info(`fetching all secrets in path ${path} with role: ${roleArn || 'pods role'}`)

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

    // Adapted from https://advancedweb.hu/2019/07/30/async_gen_paginate_aws/
    const getAllParameters = async () => {
      const EMPTY = Symbol("empty");

      const res = [];
      for await (const lf of (async function* () {
        let NextToken = EMPTY;
        while (NextToken && NextToken === EMPTY) {
          //while (NextToken || NextToken === EMPTY) {
          console.log(`Fetching paginated parameters for ${path} ...`)
          const parameters = await client.getParametersByPath({
            Path: path,
            WithDecryption: true,
            Recursive: false,
            //NextToken: NextToken !== EMPTY ? NextToken : undefined
          }).promise();
          yield* parameters.Parameters;
          NextToken = parameters.NextToken;
        }
      })()) {
        res.push(lf);
      }

      return res;
    }

    // use it
    var parameters = {}

    const ssmData = await getAllParameters();

    for (var ssmRecord in ssmData) {

      var paramName = require('path').basename(ssmData[ssmRecord].Name)
      var paramValue = ssmData[ssmRecord].Value

      parameters[paramName] = paramValue

    }
    //console.log(parameters)
    return parameters
  }
}

module.exports = SystemManagerBackendbyPath
