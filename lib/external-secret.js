'use strict'

/**
 * Block asynchronous flow.
 * @param {number} milliseconds - Number of milliseconds to block flow operation.
 * @returns {Promise} Promise object representing block flow operation.
 */
function sleep ({ milliseconds }) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/**
 * Get a stream of external secret events. This implementation uses
 * polling/batching and converts it to a stream of events.
 * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
 * @param {Object} customResourceManifest - Custom resource manifest.
 * @param {number} intervalMilliseconds - Interval time in milliseconds for polling external secrets.
 * @param {Object} logger - Logger for logging stuff.
 * @returns {Object} An async generator that yields externalsecret events.
 */
function getExternalSecretEvents ({
  kubeClient,
  customResourceManifest,
  intervalMilliseconds,
  logger
}) {
  return (async function * () {
    while (true) {
      try {
        const externalSecrets = await kubeClient
          .apis[customResourceManifest.spec.group]
          .v1[customResourceManifest.spec.names.plural]
          .get()

        // this is analagous to handling a disconnect from a watch stream
        yield {
          type: 'DELETED_ALL'
        }

        // simulate a bunch of ADDED events
        for (const externalSecret of externalSecrets.body.items) {
          yield {
            type: 'ADDED',
            object: externalSecret
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch external secrets', err)
      }
      await sleep({ milliseconds: intervalMilliseconds })
    }
  }())
}

module.exports = {
  getExternalSecretEvents
}
