'use strict'

const KVBackend = require('./kv-backend')

const tencentcloud = require('tencentcloud-sdk-nodejs')
const SsmClient = tencentcloud.ssm.v20190923.Client
const http = require('http')
const path = require('path')
/** Secrets Manager backend class. */
class TencentCloudSecretsManagerBackend extends KVBackend {
  /**
   * Create Secrets manager backend.
   * @param {Object} logger - Logger for logging stuff.
   * @param {Object} credential - Secrets manager credential.
   */
  constructor ({ logger, credential }) {
    super({ logger })
    this._credential = credential
  }

  _getTempCredential (roleName) {
    return new Promise((resolve, reject) => {
      http.get('http://' + path.join(this._credential.metadataHost, this._credential.metadataPath, roleName), function (res) {
        const { statusCode } = res
        if (statusCode !== 200) {
          reject(new Error('request temporary credential failed'))
        }
        res.on('data', (data) => { resolve(data) })
      }).on('error', (e) => {
        reject(new Error('request temporary credential on error'))
      })
    })
  }

  async _getClient ({ specOptions: { roleName } }) {
    const config = {
      credential: {
        secretId: this._credential.secretId,
        secretKey: this._credential.secretKey
      },
      region: this._credential.region,
      profile: {
        httpProfile: {
          endpoint: this._credential.ssmEndpoint
        }
      }
    }
    if (roleName) {
      const cred = await this._getTempCredential(roleName)
      const tempCredential = JSON.parse(cred)
      config.credential = {
        secretId: tempCredential.TmpSecretId,
        secretKey: tempCredential.TmpSecretKey,
        token: tempCredential.Token
      }
    }
    return new SsmClient(config)
  }

  /**
   * Get secret property value from Tencent Cloud Systen Secret Manager.
   * @param {string} key secret name used to store secret property value in Tencent Cloud Systen Secret Manager.
   * @param {object} specOptions provide additional credential information (e.g. roleName)
   * @param {object} keyOptions provide additional information of the requestd secret (e.g. versionId)
   * @returns {string} secret value.
   */

  async _get ({ key, specOptions: { roleName }, keyOptions: { versionId } }) {
    this._logger.info(`fetching secret ${key} on version stage ${versionId} from Tencent Cloud Secret Manager using role ${roleName}`)
    const client = await this._getClient({ specOptions: { roleName } })
    const value = await client.GetSecretValue({
      SecretName: key,
      VersionId: versionId
    })
    return value.SecretString.toString('utf-8')
  }
}

module.exports = TencentCloudSecretsManagerBackend
