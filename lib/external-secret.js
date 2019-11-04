'use strict'

const JSONStream = require('json-stream')

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

async function startWatcher ({
  kubeClient,
  customResourceManifest,
  logger,
  eventQueue,
  scopeNamespace = null
}) {
  const deathQueue = createEventQueue()

  let watchEndpoint = kubeClient.apis[customResourceManifest.spec.group]
    .v1.watch[customResourceManifest.spec.names.plural]

  if (scopeNamespace) {
    watchEndpoint = kubeClient.apis[customResourceManifest.spec.group]
      .v1.watch.namespaces(scopeNamespace)[customResourceManifest.spec.names.plural]
  }

  try {
    while (true) {
      logger.debug('Starting watch stream')
      const stream = watchEndpoint.getStream()

      const jsonStream = new JSONStream()
      stream.pipe(jsonStream)

      jsonStream.on('data', eventQueue.put)

      jsonStream.on('error', (err) => {
        logger.warn(err, 'Got error on stream')
        deathQueue.put('ERROR')
      })

      jsonStream.on('end', () => {
        deathQueue.put('END')
      })

      await deathQueue.take()

      logger.debug('Stopping watch stream')
      eventQueue.put({ type: 'DELETED_ALL' })

      stream.abort()
    }
  } catch (err) {
    logger.error(err, 'Watcher crashed')
    throw err
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
  kubeClient,
  customResourceManifest,
  logger,
  scopeNamespace
}) {
  return (async function * () {
    const eventQueue = createEventQueue()

    startWatcher({
      kubeClient,
      customResourceManifest,
      logger,
      eventQueue,
      scopeNamespace
    })

    while (true) {
      yield await eventQueue.take()
    }
  }())
}

module.exports = {
  getExternalSecretEvents
}
