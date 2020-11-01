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
  watchTimeout
}) {
  const deathQueue = createEventQueue()

  try {
    while (true) {
      logger.debug('Starting watch stream')

      const stream = kubeClient
        .apis[customResourceManifest.spec.group]
        .v1.watch[customResourceManifest.spec.names.plural]
        .getStream()

      const jsonStream = new JSONStream()
      stream.pipe(jsonStream)

      let timeout
      const restartTimeout = () => {
        if (timeout) {
          clearTimeout(timeout)
        }

        const timeMs = watchTimeout
        timeout = setTimeout(() => {
          logger.info(`No watch event for ${timeMs} ms, restarting watcher`)
          stream.abort()
        }, timeMs)
        timeout.unref()
      }

      jsonStream.on('data', (evt) => {
        eventQueue.put(evt)
        restartTimeout()
      })

      jsonStream.on('error', (err) => {
        logger.warn(err, 'Got error on stream')
        deathQueue.put('ERROR')
        clearTimeout(timeout)
      })

      jsonStream.on('end', () => {
        deathQueue.put('END')
        clearTimeout(timeout)
      })

      const deathEvent = await deathQueue.take()

      logger.info('Stopping watch stream due to event: %s', deathEvent)
      eventQueue.put({ type: 'DELETED_ALL' })

      stream.abort()
    }
  } catch (err) {
    logger.error(err, 'Watcher crashed')
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
  watchTimeout
}) {
  return (async function * () {
    const eventQueue = createEventQueue()

    startWatcher({
      kubeClient,
      customResourceManifest,
      logger,
      eventQueue,
      watchTimeout
    })

    while (true) {
      yield await eventQueue.take()
    }
  }())
}

module.exports = {
  getExternalSecretEvents
}
