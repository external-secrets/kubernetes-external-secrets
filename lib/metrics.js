'use strict'

const Prometheus = require('prom-client')

/** Metrics class. */
class Metrics {
  /**
   * Create Metrics object
   */
  constructor ({ registry }) {
    this._registry = registry
    this._syncCalls = new Prometheus.Counter({
      name: 'sync_calls',
      help: 'number of sync operations',
      labelNames: ['name', 'namespace', 'backend', 'status'],
      registers: [registry]
    })
    this._lastState = new Prometheus.Gauge({
      name: 'last_state',
      help: 'Value -1 if the last sync was a failure, 1 otherwise.',
      labelNames: ['name', 'namespace', 'backend'],
      registers: [registry]
    })
  }

  /**
   * Observe the result a sync process
   * @param {String} name - the name of the externalSecret
   * @param {String} namespace - the namespace of the externalSecret
   * @param {String} backend - the backend used to fetch the externalSecret
   * @param {String} status - the result of the sync process: error|success
   */
  observeSync ({ name, namespace, backend, status }) {
    this._syncCalls.inc({
      name,
      namespace,
      backend,
      status
    })
    if (status === 'success') {
      this._lastState.set({
        name,
        namespace,
        backend
      }, 1)
    } else {
      this._lastState.set({
        name,
        namespace,
        backend
      }, -1)
    }
  }
}

module.exports = Metrics
