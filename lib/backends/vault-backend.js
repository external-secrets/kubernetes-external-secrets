'use strict'

const KVBackend = require('./kv-backend')

/** Vault backend class. */
class VaultBackend extends KVBackend {
  /**
   * Create Vault backend.
   * @param {Object} client - Client for interacting with Vault.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, logger }) {
    super({ logger })
    this._client = client
  }

  /**
   * Fetch Kubernetes service account token.
   * @returns {string} String representing the token of the service account running this pod.
   */
  _fetchServiceAccountToken () {
    if (!this._serviceAccountToken) {
      const fs = require('fs')
      this._serviceAccountToken = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8')
    }
    return this._serviceAccountToken
  }

  /**
   * Get secret property value from Vault.
   * @param {string} key - Secret key in the backend.
   * @param {object} keyOptions - Options for this specific key, eg version etc.
   * @param {boolean} keyOptions.isBinary - Is the secret base64 encoded? Set to true to handle as binary.
   * @param {string} property - Property name of the vault secret
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.vaultMountPoint - mount point
   * @param {string} specOptions.vaultRole - role
   * @param {number} specOptions.kvVersion - K/V Version 1 or 2
   * @returns {Promise} Promise object representing secret property values.
   */
  async _get ({ key, keyOptions, property, specOptions: { vaultMountPoint, vaultRole, kvVersion = 2 } }) {
    if (!this._client.token) {
      const jwt = this._fetchServiceAccountToken()
      this._logger.debug('fetching new token from vault')
      const vault = await this._client.kubernetesLogin({
        mount_point: vaultMountPoint,
        role: vaultRole,
        jwt: jwt
      })
      this._client.token = vault.auth.client_token
    } else {
      this._logger.debug('renewing existing token from vault')
      this._client.tokenRenewSelf()
    }

    this._logger.debug(`reading secret key ${key} from vault`)
    const secretResponse = await this._client.read(key)

    if (kvVersion === 1) {
      if (keyOptions && keyOptions.isBinary) {
        secretResponse.data[property] = Buffer.from(secretResponse.data[property], 'base64').toString('utf8')
      }
      return JSON.stringify(secretResponse.data)
    }

    if (kvVersion === 2) {
      if (keyOptions && keyOptions.isBinary) {
        secretResponse.data.data[property] = Buffer.from(secretResponse.data.data[property], 'base64').toString('utf8')
      }
      return JSON.stringify(secretResponse.data.data)
    }

    throw new Error('Unknown "kvVersion" specified')
  }
}

module.exports = VaultBackend
