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
  }
}

module.exports = Metrics
