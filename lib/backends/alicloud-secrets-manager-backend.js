'use strict'

const KVBackend = require('./kv-backend')
const { default: Client, GetSecretValueRequest } = require('@alicloud/kms20160120')
/** Secrets Manager backend class. */
class AliCloudSecretsManagerBackend extends KVBackend {
  /**
   * Create Secrets manager backend.
   * @param {Object} logger - Logger for logging stuff.
   * @param {Object} credential - Secrets manager credential.
   */
  constructor ({ logger, credential }) {
    super({ logger })
    this._credential = credential
  }

  _getClient ({ specOptions: { roleArn } }) {
    const config = {
      endpoint: this._credential.endpoint,
      accessKeyId: this._credential.accessKeyId,
      accessKeySecret: this._credential.accessKeySecret,
      type: this._credential.type
    }
    if (roleArn) {
      config.type = 'ram_role_arn'
      config.roleArn = roleArn
    }
    return new Client(config)
  }

  /**
   * Get secret property value from Alibaba Cloud KMS Secrets Manager.
   * @param {string} key - Key used to store secret property value in Alibaba Cloud KMS Secrets Manager.
   * @returns {Promise} Promise object representing secret property value.
   */

  async _get ({ key, specOptions: { roleArn }, keyOptions: { versionStage } }) {
    this._logger.info(`fetching secret ${key} on version stage ${versionStage} from AliCloud Secret Manager using role ${roleArn}`)
    const getSecretValueRequest = new GetSecretValueRequest({
      secretName: key,
      versionStage: versionStage
    })

    const client = this._getClient({ specOptions: { roleArn } })
    const value = await client.getSecretValue(getSecretValueRequest)

    return value.secretData.toString('utf-8')
  }
}

module.exports = AliCloudSecretsManagerBackend
