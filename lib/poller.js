'use strict'

/**
 * Kubernetes secret descriptor.
 * @typedef {Object} SecretDescriptor
 * @param {string} backendType - Backend to use for fetching secret data.
 * @param {string} name - Kubernetes secret name.
 * @param {Object[]} properties - Kubernetes secret properties.
 * @param {string} properties[].key - Secret key in the backend.
 * @param {string} properties[].name - Kubernetes Secret property name.
 * @param {string} properties[].property - If the backend secret is an
 *   object, this is the property name of the value to use.
 */

/** Poller class. */
class Poller {
  /**
   * Create poller.
   * @param {Object} backends - Backends for fetching secret properties.
   * @param {number} intervalMilliseconds - Interval time in milliseconds for polling secret properties.
   * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
   * @param {Object} logger - Logger for logging stuff.
   * @param {string} namespace - Kubernetes namespace.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret descriptor.
   */
  constructor ({
    backends,
    intervalMilliseconds,
    kubeClient,
    logger,
    namespace,
    secretDescriptor,
    ownerReference
  }) {
    this._backends = backends
    this._intervalMilliseconds = intervalMilliseconds
    this._kubeClient = kubeClient
    this._logger = logger
    this._namespace = namespace
    this._secretDescriptor = secretDescriptor
    this._ownerReference = ownerReference
    this._interval = null
  }

  /**
   * Create Kubernetes secret manifest.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret description.s.
   * @returns {Object} Promise object representing Kubernetes manifest.
   */
  async _createSecretManifest ({ secretDescriptor }) {
    const data = await this._backends[secretDescriptor.backendType]
      .getSecretManifestData({ secretDescriptor })
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secretDescriptor.name,
        ownerReferences: [
          this._ownerReference
        ]
      },
      type: 'Opaque',
      data
    }
  }

  /**
   * Poll Kubernetes secrets.
   * @returns {Promise} Promise object that always resolve.
   */
  async _poll () {
    this._logger.info('running poll')
    try {
      await this._upsertKubernetesSecret({ secretDescriptor: this._secretDescriptor })
    } catch (err) {
      this._logger.error('failure while polling the secrets')
      this._logger.error(err)
    }
  }

  /**
   * Create or update Kubernets secret in the cluster.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret description.
   * @returns {Promise} Promise object representing operation result.
   */
  async _upsertKubernetesSecret ({ secretDescriptor }) {
    const secretName = secretDescriptor.name
    const secretManifest = await this._createSecretManifest({ secretDescriptor })
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    this._logger.info(`upserting secret ${secretName} in ${this._namespace}`)
    try {
      return await kubeNamespace.secrets.post({ body: secretManifest })
    } catch (err) {
      if (err.statusCode !== 409) throw err
      return kubeNamespace.secrets(secretName).put({ body: secretManifest })
    }
  }

  /**
   * Start poller.
   * @returns {Object} Poller instance.
   */
  start () {
    if (this._interval) return this
    this._logger.info('starting poller')
    this._interval = setInterval(this._poll.bind(this), this._intervalMilliseconds)
    return this
  }

  /**
   * Stop poller.
   * @returns {Object} Poller instance.
   */
  stop () {
    if (!this._interval) return this
    this._logger.info('stopping poller')
    clearInterval(this._interval)
    this._interval = null
    return this
  }
}

module.exports = Poller
