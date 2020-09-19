'use strict'

const KVBackend = require('./kv-backend')

/** Vault backend class. */
class VaultBackend extends KVBackend {
  /**
   * Create Vault backend.
   * @param {Object} vaultFactory - arrow function to create a vault client.
   * @param {Number} tokenRenewThreshold - tokens are renewed when ttl reaches this threshold
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, tokenRenewThreshold, logger, defaultVaultMountPoint, defaultVaultRole }) {
    super({ logger })
    this._vaultFactory = vaultFactory
    this._clients = new Map()
    this._tokenRenewThreshold = tokenRenewThreshold
    this._defaultVaultMountPoint = defaultVaultMountPoint
    this._defaultVaultRole = defaultVaultRole
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
   * @param {object} specOptions - Options for this external secret, eg role
   * @param {string} specOptions.vaultMountPoint - mount point
   * @param {string} specOptions.vaultRole - role
   * @param {number} specOptions.kvVersion - K/V Version 1 or 2
   * @returns {Promise} Promise object representing secret property values.
   */
  async _get ({ key, specOptions: { vaultMountPoint, vaultRole, kvVersion = 2 } }) {
    let client = this._clients.get(vaultRole)

    if (client === undefined) {
      client = this._vaultFactory()
      this._clients.set(vaultRole, client)
    }

    if (!client.token) {
      const jwt = this._fetchServiceAccountToken()
      this._logger.debug(`fetching new token from vault for role ${vaultRole}`)
      await client.kubernetesLogin({
        mount_point: vaultMountPoint || this._defaultVaultMountPoint,
        role: vaultRole || this._defaultVaultRole,
        jwt: jwt
      })
    } else {
      this._logger.debug(`checking vault token expiry for role ${vaultRole}`)
      const tokenStatus = await client.tokenLookupSelf()
      this._logger.debug(`${vaultRole} vault token valid for ${tokenStatus.data.ttl} seconds, renews at ${this._tokenRenewThreshold}`)

      if (Number(tokenStatus.data.ttl) <= this._tokenRenewThreshold) {
        this._logger.debug(`renewing ${vaultRole} vault token`)
        await client.tokenRenewSelf()
      }
    }

    this._logger.debug(`reading secret key ${key} from vault`)
    const secretResponse = await client.read(key)

    if (kvVersion === 1) {
      return JSON.stringify(secretResponse.data)
    }

    if (kvVersion === 2) {
      return JSON.stringify(secretResponse.data.data)
    }

    throw new Error('Unknown "kvVersion" specified')
  }
}

module.exports = VaultBackend
