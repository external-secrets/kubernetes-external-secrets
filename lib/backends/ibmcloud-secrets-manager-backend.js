'use strict'

const SecretsManager = require('@ibm-cloud/secrets-manager/secrets-manager/v1')
const { getAuthenticatorFromEnvironment, IamAuthenticator } = require('@ibm-cloud/secrets-manager/auth')

const KVBackend = require('./kv-backend')

/** Secrets Manager backend class. */
class IbmCloudSecretsManagerBackend extends KVBackend {
  /**
   * Create Key Vault backend.
   * @param {Object} credential - Credentials for authenticating with IBM Secrets Manager.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ credential, logger }) {
    super({ logger })
    this._credential = credential
  }

  _secretsManagerClient () {
    let authenticator
    if (process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE) {
      authenticator = getAuthenticatorFromEnvironment('IBM_CLOUD_SECRETS_MANAGER_API')
    } else {
      authenticator = new IamAuthenticator({
        apikey: this._credential.apikey
      })
    }
    const client = new SecretsManager({
      authenticator: authenticator,
      serviceUrl: this._credential.endpoint
    })
    return client
  }

  /**
   * Get secret_data property value from IBM Cloud Secrets Manager
   * @param {string} key - Key used to store secret property value.
   * @param {object} specOptions.keyByName - Interpret key as secret names if true, as id otherwise
   * @param {string} keyOptions.secretType - Type of secret - one of username_password, iam_credentials or arbitrary
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, specOptions: { keyByName }, keyOptions: { secretType } }) {
    const client = this._secretsManagerClient()
    let id = key
    keyByName = keyByName === true
    this._logger.info(`fetching ${secretType} secret ${id}${keyByName ? ' by name' : ''} from IBM Cloud Secrets Manager ${this._credential.endpoint}`)

    if (keyByName) {
      const secrets = await client.listAllSecrets({ search: key })
      const filtered = secrets.result.resources.filter((s) => (s.name === key && s.secret_type === secretType))
      if (filtered.length === 1) {
        id = filtered[0].id
      } else if (filtered.length === 0) {
        throw new Error(`No ${secretType} secret named ${key}`)
      } else {
        throw new Error(`Multiple ${secretType} secrets named ${key}`)
      }
    }

    const secret = await client.getSecret({
      secretType: secretType,
      id
    })
    if (secretType === 'iam_credentials') {
      return JSON.stringify(secret.result.resources[0].api_key)
    } else {
      return JSON.stringify(secret.result.resources[0].secret_data)
    }
  }
}

module.exports = IbmCloudSecretsManagerBackend
