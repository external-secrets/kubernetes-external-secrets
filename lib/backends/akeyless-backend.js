'use strict'
const akeyless = require('akeyless')
const akeylessCloud = require('akeyless-cloud-id')
const KVBackend = require('./kv-backend')

/** Akeyless Secrets Manager backend class. */
class AkeylessBackend extends KVBackend {
  /**
   * Create Akeyless backend.
   * @param {Object} credential - Credentials for authenticating with Akeyless Vault.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ credential, logger }) {
    super({ logger })
    this._credential = credential
  }

  _getCloudId () {
    return new Promise((resolve, reject) => {
      akeylessCloud.getCloudId(this._credential.accessType, this._credential.accessTypeParam, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  async _getSecret (key) {
    const api = this._credential.client
    const cloudId = await this._getCloudId()
    const opts = { 'access-id': this._credential.accessId, 'access-type': this._credential.accessType, 'access-key': this._credential.accessTypeParam, 'cloud-id': cloudId }

    const authResult = await api.auth(akeyless.Auth.constructFromObject(opts))
    const token = authResult.token

    const dataType = await api.describeItem(akeyless.DescribeItem.constructFromObject({
      name: key,
      token: token
    }))
    if (dataType.item_type === 'DYNAMIC_SECRET') {
      const data = await api.getDynamicSecretValue(akeyless.GetDynamicSecretValue.constructFromObject({
        name: key,
        token: token
      }))
      return JSON.stringify(data)
    }
    if (dataType.item_type === 'STATIC_SECRET') {
      const staticSecretParams = akeyless.GetSecretValue.constructFromObject({
        names: [key],
        token: token
      })
      const data = await api.getSecretValue(staticSecretParams)
      const secretValue = JSON.stringify(data[key])
      return JSON.parse(secretValue)
    } else {
      throw new Error('Invalid secret type' + dataType.item_type)
    }
  }

  /**
   * Get secret value from Akeyless Vault.
   * @param {string} key - Key the full name (path/name) of the stored secret at Akeyless.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key }) {
    this._logger.info(`fetching secret ${key} from akeyless`)
    const secret = await this._getSecret(key)
    return secret
  }
}

module.exports = AkeylessBackend
