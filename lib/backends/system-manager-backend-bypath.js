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
  async _get({ path, specOptions: { roleArn } }) {

    var parameters = []

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

    // const data = await client
    //   .getParametersByPath({
    //     Path: path,
    //     WithDecryption: true,
    //     Recursive: false
    //   })
    //   .promise()




    // Adapted from https://advancedweb.hu/2019/07/30/async_gen_paginate_aws/
    const getAllParameters = async () => {
      const EMPTY = Symbol("empty");

      const res = [];
      for await (const lf of (async function* () {
        let NextToken = EMPTY;
        while (NextToken || NextToken === EMPTY) {
          console.log(`Fetching paginated parameters for ${path} ...`)
          const parameters = await client.getParametersByPath({
            Path: path,
            WithDecryption: true,
            Recursive: false,
            NextToken: NextToken !== EMPTY ? NextToken : undefined
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
    const ssmData = await getAllParameters();

    // client.getParametersByPath({ Path: path, Recursive: true, WithDecryption: true }, (err, data) => {
    //   if (err) throw err, reject()
    //   saveParameter(data)
    // })



    // async function handleResponse(response) {
    //   new Promise((resolve, reject) => {
    //     if (response.Parameters.length === 0) reject()
    //     response.Parameters.forEach(saveParameter)
    //     if (!response.NextToken) {
    //       console.log('======================================== FINISHED ========================================')
    //       resolve()
    //     }
    //     await getParametersByPath(response.NextToken, handleResponse)
    //   })
    // }

    // async function getParametersByPath(nextToken, callback) {
    //   new Promise((resolve, reject) => {
    //     const params = { Path: path, Recursive: true, WithDecryption: true }

    //     if (nextToken) params['NextToken'] = nextToken

    //     client.getParametersByPath(params, (err, data) => {
    //       if (err) throw err, reject()
    //       callback(data)
    //     })
    //   })
    // }

    // function saveParameter(parameter) {
    //   const envName = require('path').basename(parameter.Name)
    //   console.log(`${envName}="${parameter.Value}"`)
    //   parameters.push({
    //     key: envName,
    //     value: parameter.Value
    //   })
    // }

    //const data = await getParametersByPath(null, handleResponse)

    //console.log(data)
    //console.log(data['Parameters'])
    // data.map(param => {
    //   console.log(param.Name + ": " + param.Value)
    // });
    //this._logger.info(`DATA: ${returnedparameters}`)
    //this._logger.info(`DATA: ${JSON.stringify(data)}`)

    // parsedJson = JSON.parse(data)
    // var parameters = []

    for (var ssmRecord in ssmData) {

      var paramName = data[ssmRecord].Name
      var paramValue = data[ssmRecord].Value

      //console.log(paramName + ": " + paramValue);

      parameters.push({
        key: paramName,
        value: paramValue
      })
    }

    //console.log(parameters)



    //var parameters = ""
    return parameters
  }
}

module.exports = SystemManagerBackendbyPath
