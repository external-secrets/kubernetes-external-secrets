'use strict'

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
  namespace = null,
  customResourceManifest,
  logger,
  eventQueue,
  watchTimeout
}) {
  const deathQueue = createEventQueue()
  const loggedNamespaceName = namespace || '*'

  try {
    while (true) {
      logger.debug('Starting watch stream for namespace %s', loggedNamespaceName)

      let api = kubeClient
        .apis[customResourceManifest.spec.group]
        .v1.watch

      if (namespace) {
        api = api.namespaces(namespace)
      }

      const stream = await api[customResourceManifest.spec.names.plural]
        .getObjectStream()

      let timeout
      const restartTimeout = () => {
        if (timeout) {
          clearTimeout(timeout)
        }

        const timeMs = watchTimeout
        timeout = setTimeout(() => {
          logger.info(`No watch event for ${timeMs} ms, restarting watcher for ${loggedNamespaceName}`)
          stream.end()
        }, timeMs)
        timeout.unref()
      }

      stream.on('data', (evt) => {
        eventQueue.put(evt)
        restartTimeout()
      })

      stream.on('error', (err) => {
        logger.warn(err, 'Got error on stream for namespace %s', loggedNamespaceName)
        deathQueue.put('ERROR')
        clearTimeout(timeout)
      })

      stream.on('end', () => {
        deathQueue.put('END')
        clearTimeout(timeout)
      })

      restartTimeout()

      const deathEvent = await deathQueue.take()

      logger.info('Stopping watch stream for namespace %s due to event: %s', loggedNamespaceName, deathEvent)
      eventQueue.put({ type: 'DELETED_ALL' })
      stream.end()
    }
  } catch (err) {
    logger.error(err, 'Watcher for namespace %s crashed', loggedNamespaceName)
    throw err
  }
}

/**
 * Get a stream of external secret events. This implementation uses
 * watch and yields as a stream of events.
 * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
 * @param {Array} watchedNamespaces - List of scoped namespaces.
 * @param {Object} customResourceManifest - Custom resource manifest.
 * @returns {Object} An async generator that yields externalsecret events.
 */
function getExternalSecretEvents ({
  kubeClient,
  watchedNamespaces,
  customResourceManifest,
  logger,
  watchTimeout
}) {
  return (async function * () {
    const eventQueue = createEventQueue()

    // If the watchedNamespaces is set create a watcher for each namespace, otherwise create a watcher for all namespaces.
    if (watchedNamespaces.length) {
      // Create watcher for each namespace
      watchedNamespaces.forEach((namespace) => {
        startWatcher({
          namespace,
          kubeClient,
          customResourceManifest,
          logger,
          eventQueue,
          watchTimeout
        })
      })
    } else {
      startWatcher({
        kubeClient,
        customResourceManifest,
        logger,
        eventQueue,
        watchTimeout
      })
    }

    while (true) {
      yield await eventQueue.take()
    }
  }())
}

module.exports = {
  getExternalSecretEvents
}
