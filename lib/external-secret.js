'use strict'

const k8s = require('@kubernetes/client-node')

/**
 * Creates an FIFO queue which you can put to and take from.
 * If theres nothing to take it will wait with resolving until
 * something is put to the queue.
 * @returns {Object} Queue instance with put and take methods
 */
function createEventQueue () {
  const queuedEvents = []
  const waitingResolvers = []

  return {
    take: () => queuedEvents.length > 0
      ? Promise.resolve(queuedEvents.shift())
      : new Promise(resolve => waitingResolvers.push(resolve)),
    put: (msg) => waitingResolvers.length > 0
      ? waitingResolvers.shift()(msg)
      : queuedEvents.push(msg)
  }
}

/**
 * Get a stream of external secret events. This implementation uses
 * watch and yields as a stream of events.
 * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
 * @param {Object} customResourceManifest - Custom resource manifest.
 * @returns {Object} An async generator that yields externalsecret events.
 */
function getExternalSecretEvents ({
  k8sCoApi,
  kubeConfig,
  customResourceManifest,
  logger
}) {
  return (async function * () {
    const eventQueue = createEventQueue()

    const informer = k8s.makeInformer(kubeConfig, `/apis/${customResourceManifest.spec.group}/v1/${customResourceManifest.spec.names.plural}`, () => {
      return k8sCoApi.listClusterCustomObject(customResourceManifest.spec.group, 'v1', customResourceManifest.spec.names.plural)
    })

    informer.on('add', (object) => eventQueue.put({ type: 'ADDED', object }))
    informer.on('update', (object) => eventQueue.put({ type: 'MODIFIED', object }))
    informer.on('delete', (object) => eventQueue.put({ type: 'DELETED', object }))
    informer.on('error', (err) => {
      logger.error(err, 'Watcher died, restarting in 5sec')

      eventQueue.put({ type: 'DELETED_ALL' })

      // Restart informer after 5sec
      setTimeout(() => {
        informer.start()
      }, 5000)
    })

    await informer.start()

    while (true) {
      yield await eventQueue.take()
    }
  }())
}

module.exports = {
  getExternalSecretEvents
}
