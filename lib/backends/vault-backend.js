'use strict'

const KVBackend = require('./kv-backend')

/** Secrets Manager backend class. */
class VaultBackend extends KVBackend {
  /**
   * Create Vault backend.
   * @param {Object} client - Client for interacting with Vault.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ client, logger }) {
    super({ logger })
    this._client = client
    this._serviceAccountToken
  }

   /**
   * Fetch Kubernetes service account token.
   * @returns {string} String representing the token of the service account running this pod.
   */
  _fetchServiceAccountToken () {
    if (!this._serviceAccountToken) {
      var fs = require('fs');
      this._serviceAccountToken = fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf8")
    }
    return this._serviceAccountToken
  }

   /**
   * Fetch Kubernetes secret property values.
   * @param {Object[]} secretProperties - Kubernetes secret properties.
   * @param {string} secretProperties[].key - Secret key in the backend.
   * @param {string} secretProperties[].name - Kubernetes Secret property name.
   * @param {string} secretProperties[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchSecretPropertyValues ({ vaultMountPoint, vaultRole, jwt, externalData }) {
    return Promise.all(externalData.map(async secretProperty => {
      this._logger.info(`fetching secret property ${secretProperty.name}`)
      const value = await this._get({ vaultMountPoint: vaultMountPoint, vaultRole: vaultRole, jwt: jwt, secretKey: secretProperty.key })

      if ('property' in secretProperty) {
        return value[secretProperty.property]
      }
      return value
    }))
  }

  /**
   * Get secret property value from Vault.
   * @param {string} secretKey - Key used to store secret property value in Vault.
   * @returns {Promise} Promise object representing secret property value.
   */
  async _get ({ vaultMountPoint, vaultRole, secretKey }) {
    if (!this._client.token) {
      var jwt = this._fetchServiceAccountToken()
      this._logger.debug(`fetching new token from vault`)
      var vault = await this._client.kubernetesLogin({
        mount_point: vaultMountPoint,
        role: vaultRole,
        jwt: jwt
      })
      this._client.token = vault.auth.client_token
    } else {
      this._logger.debug(`renewing existing token from vault`)
      this._client.tokenRenewSelf()
    }

    var secretResponse = await this._client.read(secretKey)
    
    return JSON.stringify(secretResponse.data.data)
  }

  /**
   * Fetch Kubernetes secret manifest data.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret descriptor.
   * @returns {Promise} Promise object representing Kubernetes secret manifest data.
   */
  async getSecretManifestData ({ secretDescriptor }) {
    const data = {}
    // Use secretDescriptor.properties to be backwards compatible.
    const vaultMountPoint = secretDescriptor.vaultMountPoint
    const vaultRole = secretDescriptor.vaultRole
    
    const externalData = secretDescriptor.data || secretDescriptor.properties
    const secretPropertyValues = await this._fetchSecretPropertyValues({
      vaultMountPoint,
      vaultRole,
      externalData
    })
    externalData.forEach((secretProperty, index) => {
      data[secretProperty.name] = (Buffer.from(secretPropertyValues[index], 'utf8')).toString('base64')
    })
    return data
  }
}

module.exports = VaultBackend
