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

const annotationPermittedKey = 'iam.amazonaws.com/permitted'

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
   * @returns {Object} Promise object representing Kubernetes manifest.
   */
  async _createSecretManifest () {
    const secretDescriptor = this._secretDescriptor
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
      type: secretDescriptor.type || 'Opaque',
      data
    }
  }

  /**
   * Poll Kubernetes secrets.
   * @returns {Promise} Promise object that always resolves.
   */
  async _poll () {
    this._logger.info(`running poll on the secret ${this._secretDescriptor.name}`)
    try {
      await this._upsertKubernetesSecret()
    } catch (err) {
      this._logger.error(err, `failure while polling the secret ${this._secretDescriptor.name}`)
    }
  }

  /**
   * Create or update Kubernets secret in the cluster.
   * @returns {Promise} Promise object representing operation result.
   */
  async _upsertKubernetesSecret () {
    const secretDescriptor = this._secretDescriptor
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    // check if namespace is allowed to fetch this secret
    const ns = await kubeNamespace.get()
    const verdict = this._isPermitted(ns.body, secretDescriptor)
    if (!verdict.allowed) {
      throw (new Error(`not allowed to fetch secret: ${secretDescriptor.name}: ${verdict.reason}`))
    }
    const secretManifest = await this._createSecretManifest()
    this._logger.info(`upserting secret ${this._secretDescriptor.name} in ${this._namespace}`)
    try {
      return await kubeNamespace.secrets.post({ body: secretManifest })
    } catch (err) {
      if (err.statusCode !== 409) throw err
      return kubeNamespace.secrets(this._secretDescriptor.name).put({ body: secretManifest })
    }
  }

  /**
   * checks if the supplied namespace is allowed to sync the given secret
   *
   * @param {Object} namespace namespace object
   * @param {Object} descriptor secret descriptor
   */
  _isPermitted (namespace, descriptor) {
    const role = descriptor.roleArn
    let allowed = true
    let reason = ''

    if (!namespace.metadata.annotations) {
      return {
        allowed, reason
      }
    }
    // an empty annotation value allows access to all roles
    const re = new RegExp(namespace.metadata.annotations[annotationPermittedKey])

    if (!re.test(role)) {
      allowed = false
      reason = `namspace does not allow to assume role ${role}`
    }

    return {
      allowed,
      reason
    }
  }

  /**
   * Checks if secret exists, if not trigger a poll
   */
  async _checkForSecret () {
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    try {
      await kubeNamespace.secrets(this._secretDescriptor.name).get()
    } catch (err) {
      if (err.statusCode === 404) {
        this._logger.info(`Secret ${this._secretDescriptor.name} does not exist, polling right away`)
        this._poll()
      }
    }
  }

  /**
   * Start poller.
   * @param {boolean} forcePoll - Trigger poll right away
   * @returns {Object} Poller instance.
   */
  start ({ forcePoll = false } = {}) {
    if (this._interval) return this

    if (forcePoll) {
      this._poll()
    } else {
      this._checkForSecret()
    }

    this._logger.info(`starting poller on the secret ${this._secretDescriptor.name}`)
    this._interval = setInterval(this._poll.bind(this), this._intervalMilliseconds)
    return this
  }

  /**
   * Stop poller.
   * @returns {Object} Poller instance.
   */
  stop () {
    if (!this._interval) return this
    this._logger.info(`stopping poller on the secret ${this._secretDescriptor.name}`)
    clearInterval(this._interval)
    this._interval = null
    return this
  }
}

module.exports = Poller
