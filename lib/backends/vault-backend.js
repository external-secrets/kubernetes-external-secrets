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
  constructor ({ vaultFactory, tokenRenewThreshold, logger, defaultVaultMountPoint, defaultVaultRole }) {
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
  async _get ({ key, specOptions: { vaultMountPoint = null, vaultRole = null, kvVersion = 2 } }) {
    const vaultMountPointGet = vaultMountPoint || this._defaultVaultMountPoint
    const vaultRoleGet = vaultRole || this._defaultVaultRole
    // Create cache key for auth specific client
    const clientCacheKey = `|m${vaultMountPointGet}|r${vaultRoleGet}|`
    // Lookup existing or create new vault client
    let client = this._clients.get(clientCacheKey)
    if (!client) {
      client = this._vaultFactory()
      this._clients.set(clientCacheKey, client)
    }

    // If we already have a cached token then inspect it...
    if (client.token) {
      try {
        this._logger.debug(`checking vault token expiry for role ${vaultRoleGet} on ${vaultMountPointGet}`)
        const tokenStatus = await client.tokenLookupSelf()
        this._logger.debug(`vault token (role ${vaultRoleGet} on ${vaultMountPointGet}) valid for ${tokenStatus.data.ttl} seconds, renews at ${this._tokenRenewThreshold}`)

        // If it needs renewing, renew it.
        if (Number(tokenStatus.data.ttl) <= this._tokenRenewThreshold) {
          this._logger.debug(`renewing role ${vaultRoleGet} on ${vaultMountPointGet} vault token`)
          if (!(await client.tokenRenewSelf())) {
            this._logger.debug(`cached token renewal failed.  Clearing cached token for role ${vaultRoleGet} on ${vaultMountPointGet}`)
            client.token = null
          }
        }
      } catch {
        // If it can't be inspected/renewed, we clear the token.
        this._logger.debug(`cached token operation failed.  Clearing cached token for role ${vaultRoleGet} on ${vaultMountPointGet}`)
        client.token = null
      }
    }

    // If we don't have a token here we either never had one or we just failed to renew it, so get a new one by logging-in
    if (!client.token) {
      const jwt = this._fetchServiceAccountToken()
      this._logger.debug(`fetching new token from vault for role ${vaultRoleGet} on ${vaultMountPointGet}`)
      await client.kubernetesLogin({
        mount_point: vaultMountPointGet,
        role: vaultRoleGet,
        jwt: jwt
      })
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
