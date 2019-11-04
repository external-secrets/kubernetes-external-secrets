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
   * @param {Object} customResourceManifest - CRD manifest
   * @param {Object} externalSecret - ExternalSecret manifest.
   * @param {Object} metrics - Metrics client.
   */
  constructor ({
    backends,
    intervalMilliseconds,
    kubeClient,
    logger,
    metrics,
    customResourceManifest,
    externalSecret
  }) {
    this._backends = backends
    this._intervalMilliseconds = intervalMilliseconds
    this._kubeClient = kubeClient
    this._logger = logger
    this._timeoutId = null
    this._metrics = metrics
    this._customResourceManifest = customResourceManifest

    this._externalSecret = externalSecret

    const { name, uid, namespace } = externalSecret.metadata

    this._secretDescriptor = { ...externalSecret.secretDescriptor, name }

    this._ownerReference = {
      apiVersion: externalSecret.apiVersion,
      controller: true,
      kind: externalSecret.kind,
      name,
      uid
    }

    this._namespace = namespace
    this._name = name

    this._status = this._kubeClient
      .apis[this._customResourceManifest.spec.group]
      .v1.namespaces(this._namespace)[this._customResourceManifest.spec.names.plural](this._name).status
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
    this._logger.info(`running poll on the secret ${this._name}`)

    try {
      await this._upsertKubernetesSecret()
      await this._updateStatus('SUCCESS')

      this._metrics.observeSync({
        name: this._name,
        namespace: this._namespace,
        backend: this._secretDescriptor.backendType,
        status: 'success'
      })
    } catch (err) {
      this._logger.error(err, `failure while polling the secret ${this._name}`)
      await this._updateStatus(`ERROR, ${err.message}`)

      this._metrics.observeSync({
        name: this._name,
        namespace: this._namespace,
        backend: this._secretDescriptor.backendType,
        status: 'error'
      })
    }
  }

  /**
   * Create or update Kubernets secret in the cluster.
   * @returns {Promise} Promise object representing operation result.
   */
  async _upsertKubernetesSecret () {
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    // check if namespace is allowed to fetch this secret
    const ns = await kubeNamespace.get()
    const verdict = this._isPermitted(ns.body, this._secretDescriptor)

    if (!verdict.allowed) {
      throw (new Error(`not allowed to fetch secret: ${this._name}: ${verdict.reason}`))
    }

    const secretManifest = await this._createSecretManifest()
    this._logger.info(`upserting secret ${this._name} in ${this._namespace}`)

    try {
      return await kubeNamespace.secrets.post({ body: secretManifest })
    } catch (err) {
      if (err.statusCode !== 409) throw err
      return kubeNamespace.secrets(this._name).put({ body: secretManifest })
    }
  }

  async _updateStatus (status) {
    await this._status.put({
      body: {
        ...this._externalSecret,
        status: {
          lastSync: `${new Date().toISOString()}`,
          observedGeneration: this._externalSecret.metadata.generation,
          status
        }
      }
    })
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
   * Checks status of external secret and determines time to next poll
   * If current observed generation is older than ES generation it will poll right away
   * otherwise check when it was last polled and set timeout for next poll
   */
  async _scheduleNextPoll () {
    try {
      const {
        body: {
          status: {
            lastSync = null,
            observedGeneration = 0
          } = {}
        } = {}
      } = await this._status.get()

      const currentGeneration = this._externalSecret.metadata.generation

      if (observedGeneration < currentGeneration) {
        return this._setNextPoll(0)
      }

      const now = Date.now()
      const lastPollTime = Date.parse(lastSync) || 0

      // If time somehow ends up in the future we schedule a new poll
      // right away and hopefully get a new saner value
      if (lastPollTime > now) {
        return this._setNextPoll(0)
      }

      const elapsedTime = now - lastPollTime
      const nextPollIn = Math.max(this._intervalMilliseconds - elapsedTime, 0)

      return this._setNextPoll(nextPollIn)
    } catch (err) {
      this._logger.error(err, 'status check went boom for %s in %s', this._name, this._namespace)
    }
  }

  /**
   * Sets a timeout for the next poll
   * @param {number} nextPollIn - Trigger poll in this many miliseconds
   */
  _setNextPoll (nextPollIn = this._intervalMilliseconds) {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId)
      this._timeoutId = null
    }

    this._timeoutId = setTimeout(this._poll.bind(this), nextPollIn)
    this._logger.debug('Next poll for %s in %s in %s', this._name, this._namespace, nextPollIn)
  }

  /**
   * Start poller.
   * @param {boolean} forcePoll - Trigger poll right away
   * @returns {Object} Poller instance.
   */
  start () {
    if (this._timeoutId) return this

    this._logger.info(`starting poller on the secret ${this._name}`)
    this._scheduleNextPoll()

    return this
  }

  /**
   * Stop poller.
   * @returns {Object} Poller instance.
   */
  stop () {
    if (!this._timeoutId) return this

    this._logger.info(`stopping poller on the secret ${this._name}`)

    clearTimeout(this._timeoutId)
    this._timeoutId = null

    return this
  }
}

module.exports = Poller
