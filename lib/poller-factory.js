'use strict'

const Poller = require('./poller')

class PollerFactory {
  /**
   * Create PollerFactory.
   * @param {Object} backends - Backends for fetching secret properties.
   * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
   * @param {Object} metrics - Metrics client
   * @param {Object} customResourceManifest - CRD manifest
   * @param {Object} logger - Logger for logging stuff.
   * @param {number} pollerIntervalMilliseconds - Interval time in milliseconds for polling secret properties.
   * @param {String} rolePermittedAnnotation - namespace annotation that defines which roles can be assumed within this namespace
   */
  constructor ({
    backends,
    kubeClient,
    metrics,
    pollerIntervalMilliseconds,
    rolePermittedAnnotation,
    customResourceManifest,
    logger
  }) {
    this._logger = logger
    this._metrics = metrics
    this._backends = backends
    this._kubeClient = kubeClient
    this._pollerIntervalMilliseconds = pollerIntervalMilliseconds
    this._customResourceManifest = customResourceManifest
    this._rolePermittedAnnotation = rolePermittedAnnotation
  }

  /**
   * Create poller
   * @param {Object} externalSecret - External Secret custom resource oject
   */
  createPoller ({ externalSecret }) {
    const poller = new Poller({
      backends: this._backends,
      intervalMilliseconds: this._pollerIntervalMilliseconds,
      kubeClient: this._kubeClient,
      logger: this._logger,
      metrics: this._metrics,
      customResourceManifest: this._customResourceManifest,
      rolePermittedAnnotation: this._rolePermittedAnnotation,
      externalSecret
    })

    return poller
  }
}

module.exports = PollerFactory
