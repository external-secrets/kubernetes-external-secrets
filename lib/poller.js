'use strict'

const clonedeep = require('lodash/cloneDeep')
const merge = require('lodash/merge')
const mapValues = require('lodash/mapValues')
const { compileObjectTemplateKeys } = require('./utils')

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
 * @param {string} properties[].versionStage - If the backend supports versioning, eg secretsManager backend
 * @param {string} properties[].versionId - If the backend supports versioning, eg secretsManager backend
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
   * @param {Object} customResourceManifest - CRD manifest
   * @param {Object} externalSecret - ExternalSecret manifest.
   * @param {string} rolePermittedAnnotation - namespace annotation that defines which roles can be assumed within this namespace
   * @param {string} namingPermittedAnnotation - namespace annotation that defines which keys can be assumed within this namespace
   * @param {string} enforceNamespaceAnnotation - should enforce namespace annotations
   * @param {Object} metrics - Metrics client.
   */
  constructor ({
    backends,
    intervalMilliseconds,
    kubeClient,
    logger,
    metrics,
    customResourceManifest,
    rolePermittedAnnotation,
    namingPermittedAnnotation,
    enforceNamespaceAnnotation,
    pollingDisabled,
    externalSecret
  }) {
    this._backends = backends
    this._intervalMilliseconds = intervalMilliseconds
    this._kubeClient = kubeClient
    this._logger = logger
    this._timeoutId = null
    this._metrics = metrics
    this._pollingDisabled = pollingDisabled
    this._rolePermittedAnnotation = rolePermittedAnnotation
    this._namingPermittedAnnotation = namingPermittedAnnotation
    this._customResourceManifest = customResourceManifest
    this._enforceNamespaceAnnotation = enforceNamespaceAnnotation

    this._externalSecret = externalSecret
    this._spec = externalSecret.spec || externalSecret.secretDescriptor

    const { name, uid, namespace } = externalSecret.metadata

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
    const spec = this._spec
    let template = spec.template || {}

    // spec.type for backwards compat
    const type = template.type || spec.type || 'Opaque'

    const data = await this._backends[spec.backendType]
      .getSecretManifestData({ spec })

    if (template && typeof template === 'object' && !Array.isArray(template)) {
      const decodedData = mapValues(data, value => Buffer.from(value, 'base64').toString('ascii'))

      template = compileObjectTemplateKeys(template, decodedData)
    }

    const secretManifest = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: this._name,
        ownerReferences: [
          this._ownerReference
        ]
      },
      type,
      data
    }

    return merge(clonedeep(template), secretManifest)
  }

  /**
   * Poll Kubernetes secrets.
   * @returns {Promise} Promise object that always resolves.
   */
  async _poll () {
    this._logger.info(`running poll on the secret ${this._namespace}/${this._name}`)

    try {
      await this._upsertKubernetesSecret()
      await this._updateStatus('SUCCESS')

      this._metrics.observeSync({
        name: this._name,
        namespace: this._namespace,
        backend: this._spec.backendType,
        status: 'success'
      })
    } catch (err) {
      this._logger.error(err, `failure while polling the secret ${this._namespace}/${this._name}`)
      await this._updateStatus(`ERROR, ${err.message}`)

      this._metrics.observeSync({
        name: this._name,
        namespace: this._namespace,
        backend: this._spec.backendType,
        status: 'error'
      })
    }
  }

  /**
   * Create or update Kubernetes secret in the cluster.
   * @returns {Promise} Promise object representing operation result.
   */
  async _upsertKubernetesSecret () {
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    // check if namespace is allowed to fetch this secret
    const ns = await kubeNamespace.get()
    const verdict = this._isPermitted(ns.body, this._spec)

    if (!verdict.allowed) {
      throw (new Error(`not allowed to fetch secret: ${this._namespace}/${this._name}: ${verdict.reason}`))
    }

    const secretManifest = await this._createSecretManifest()
    const kubeSecret = kubeNamespace.secrets(this._name)
    let existingSecret

    try {
      this._logger.info(`getting secret ${this._namespace}/${this._name}`)
      const secretResponse = await kubeSecret.get()
      existingSecret = secretResponse.body
    } catch (err) {
      if (err.statusCode !== 404) throw err
      // do nothing if the secret is not found
    }

    if (existingSecret && this._equalSecretData(existingSecret, secretManifest)) {
      this._logger.info(`skipping secret ${this._namespace}/${this._name} upsert, objects are the same`)
      return Promise.resolve(true)
    } else if (existingSecret === undefined) {
      this._logger.info(`creating secret ${this._namespace}/${this._name}`)
      return await kubeNamespace.secrets.post({ body: secretManifest })
    } else {
      this._logger.info(`updating secret ${this._namespace}/${this._name}`)
      return kubeSecret.put({ body: secretManifest })
    }
  }

  /**
   * Checks if a secret and the desired secret manifest are equal
   *
   * @param   {Object}  kubeSecret      An actual kubernetes secret from the kube-client
   * @param   {Object}  secretManifest  A hash representing the desired secret
   *
   * @return  {Boolean}                  Boolean if they are the same or not
   */
  _equalSecretData (kubeSecret, secretManifest) {
    let result = true
    const liveSecret = clonedeep(kubeSecret)
    const desiredSecret = clonedeep(secretManifest)

    // Only use annotations and labels for metadata checking
    const secrets = [liveSecret, desiredSecret]
    secrets.forEach((s) => {
      s.metadata = {
        labels: s.metadata.labels,
        annotations: s.metadata.annotations
      }
    })

    result = result ? JSON.stringify(liveSecret.metadata) === JSON.stringify(desiredSecret.metadata) : false

    // check secret data
    result = result ? JSON.stringify(liveSecret.data) === JSON.stringify(desiredSecret.data) : false
    return result
  }

  async _updateStatus (status) {
    // Remove newlines, spaces, and tabs from status string
    status = status.replace(/(\r\n|\n|\r| (?= ))/gm, '').replace(/\t/g, ' ')

    try {
      this._logger.debug(`updating status for ${this._namespace}/${this._name} to: ${status}`)
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
    } catch (err) {
      if (err.statusCode !== 409) {
        this._logger.error(err, `failure while updating status for externalsecret ${this._namespace}/${this._name}`)
        throw err
      }
      this._logger.info(`status update failed for externalsecret ${this._namespace}/${this._name}, due to modification, new poller should start`)
    }
  }

  /**
   * checks if the supplied namespace is allowed to sync the given secret
   *
   * @param {Object} namespace namespace object
   * @param {Object} descriptor secret descriptor
   */
  _isPermitted (namespace, descriptor) {
    let allowed = true
    let reason = ''

    if (!namespace.metadata.annotations) {
      allowed = !this._enforceNamespaceAnnotation
      reason = this._enforceNamespaceAnnotation ? 'Namespace annotation is required' : ''
      return {
        allowed, reason
      }
    }

    // 1. testing naming convention if defined in namespace

    const externalData = descriptor.data || descriptor.properties
    const namingConvention = namespace.metadata.annotations[this._namingPermittedAnnotation]
    let reNaming = new RegExp()
    if (Array.isArray(namingConvention)) {
      reNaming = new RegExp(namingConvention.join('|'))
    } else {
      reNaming = new RegExp(namingConvention)
    }

    if (!namingConvention && this._enforceNamespaceAnnotation) {
      allowed = false
      reason = `Missing required annotation ${this._namingPermittedAnnotation} on namespace ${namespace.metadata.name}`
      return {
        allowed, reason
      }
    }

    // Testing data property
    if (namingConvention && externalData) {
      externalData.forEach((secretProperty, index) => {
        if ('path' in secretProperty && !reNaming.test(secretProperty.path)) {
          allowed = false
          reason = `path ${secretProperty.path} does not match naming convention ${namingConvention}`
          return {
            allowed, reason
          }
        }

        if ('key' in secretProperty && !reNaming.test(secretProperty.key)) {
          allowed = false
          reason = `key name ${secretProperty.key} does not match naming convention ${namingConvention}`
          return {
            allowed, reason
          }
        }
      })
    }

    // Testing DataFrom property
    const externalDataFrom = descriptor.dataFrom
    if (namingConvention && externalDataFrom) {
      externalDataFrom.forEach((secretProperty, index) => {
        if (!reNaming.test(secretProperty)) {
          allowed = false
          reason = `key name ${secretProperty} does not match naming convention ${namingConvention}`
          return {
            allowed, reason
          }
        }
      })
    }

    // 2. testing assume role if configured

    const role = descriptor.roleArn || descriptor.vaultRole

    if (!role) {
      return {
        allowed, reason
      }
    }

    if (!namespace.metadata.annotations[this._rolePermittedAnnotation] && this._enforceNamespaceAnnotation) {
      allowed = false
      reason = `Missing required annotation ${this._rolePermittedAnnotation} on namespace ${namespace.metadata.name}`
      return {
        allowed, reason
      }
    }
    // an empty annotation value allows access to all roles
    const re = new RegExp(namespace.metadata.annotations[this._rolePermittedAnnotation])

    if (!re.test(role)) {
      allowed = false
      reason = `namespace does not allow to assume role ${role}`
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

      // If polling is disabled we only react to changes in the ExternalSecret
      if (this._pollingDisabled) {
        return
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
      this._logger.error(err, `status check went boom for ${this._namespace}/${this._name}`)
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
    this._logger.debug(`next poll for ${this._namespace}/${this._name} in ${nextPollIn} ms`)
  }

  /**
   * Start poller.
   * @param {boolean} forcePoll - Trigger poll right away
   * @returns {Object} Poller instance.
   */
  start () {
    if (this._timeoutId) return this

    this._logger.info(`starting poller for ${this._namespace}/${this._name}`)
    this._scheduleNextPoll()

    return this
  }

  /**
   * Stop poller.
   * @returns {Object} Poller instance.
   */
  stop () {
    if (!this._timeoutId) return this

    this._logger.info(`stopping poller for ${this._namespace}/${this._name}`)

    clearTimeout(this._timeoutId)
    this._timeoutId = null

    return this
  }
}

module.exports = Poller
