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
    if (process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE && process.env.IBM_CLOUD_SECRETS_MANAGER_API_APIKEY) {
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
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} keyOptions.secretType - Type of secret - one of username_password, iam_credentials or arbitrary
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ key, keyOptions: { secretType } }) {
    const client = this._secretsManagerClient()
    this._logger.info(`fetching secret ${key} from IBM Cloud Secrets Manager ${this._credential.endpoint}`)
    const secret = await client.getSecret({
      secretType: secretType,
      id: key
    })
    return JSON.stringify(secret.result.resources[0].secret_data)
  }
}

module.exports = IbmCloudSecretsManagerBackend
