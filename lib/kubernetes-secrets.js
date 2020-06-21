'use strict'

/**
 * Kubernetes secret observer.
 * @param {string} timeoutId - An ID of setTimeout which schedules next poll of internal secrets.
 * @param {Object} secrets - Object of secret names present in given namespace.
 * Watch for Kubernetes secrets, and provide status promises.
 */

/** Kubernetes secret observer class. */
class KubernetesSecrets {
  /**
   * Create secrets observer.
   * @param {string} namespace - A namespace to poll for internal secrets.
   * @param {number} intervalMilliseconds - Interval time in milliseconds for polling secret properties.
   * @param {Object} logger - Logger for logging stuff.
   * @param {Object} metrics - Metrics client.
   */
  constructor ({ namespace, kubeClient, intervalMilliseconds, logger, metrics }) {
    this._intervalMilliseconds = intervalMilliseconds
    this._logger = logger
    this._metrics = metrics
    this._kubeClient = kubeClient
    this._timeoutId = null
    this._secrets = {}
    this._namespace = namespace
  }

  /**
   * Return current set of present secret names
   * @returns {Array} - secret names listing
   */
  get secretNames () {
    return Object.keys(this._secrets)
  }

  /**
   * Refresh Kubernetes secrets.
   * Set timeout for next refresh.
   */
  async _listAndRefreshSecrets () {
    const kubeNamespace = this._kubeClient.api.v1.namespaces(this._namespace)

    const newSecrets = {}
    const kubeSecrets = await kubeNamespace.secrets.get()

    for (const kubeSecret of kubeSecrets.body.items) {
      newSecrets[kubeSecret.metadata.name] = kubeSecret
    }

    this._secrets = newSecrets
    this._metrics.observeSync({
      name: 'all-internal-secrets-list',
      namespace: this._namespace,
      status: 'success'
    })
    this._timeoutId = setTimeout(this._listAndRefreshSecrets.bind(this), this._intervalMilliseconds)
  }

  /**
   * Find out if given secret exists in a namespace.
   * @param {string} secretName Name of secret
   *
   * @returns {boolean} A boolean status of k8s secret presence.
   */
  secretPresent (secretName) {
    return (secretName in this._secrets)
  }

  /**
   * Start this secrets observer.
   */
  start () {
    this._logger.info(`starting kubernetes secrets observer for namespace ${this._namespace}.`)
    this._timeoutId = setTimeout(this._listAndRefreshSecrets.bind(this), this._intervalMilliseconds)
    return this
  }

  /**
   * Stop this secrets observer.
   */
  stop () {
    if (this._timeoutId != null) {
      clearTimeout(this._timeoutId)
    }
  }

  /**
   * Get or create secret observer in given namespace.
   */
  static getOrCreateSecretObserver (props) {
    const nsName = props.namespace

    if (!(nsName in KubernetesSecrets.secretObservers)) {
      KubernetesSecrets.secretObservers[nsName] =
          new KubernetesSecrets(props)
    }

    return KubernetesSecrets.secretObservers[nsName]
  }
}

// A static object containing namespace name as a key, and secret
// observer instance as a value.
KubernetesSecrets.secretObservers = {}

module.exports = KubernetesSecrets
