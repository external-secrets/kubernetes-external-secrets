'use strict'

/** Daemon class. */
class Daemon {
  /**
   * Create daemon.
   * @param {Object} backends - Backends for fetching secret properties.
   * @param {Object} externalSecretEvents - Stream of external secret events.
   * @param {Object} logger - Logger for logging stuff.
   * @param {PollerFactory} pollerFactory - A poller factory instance
   */
  constructor ({
    externalSecretEvents,
    logger,
    pollerFactory
  }) {
    this._externalSecretEvents = externalSecretEvents
    this._logger = logger
    this._pollerFactory = pollerFactory

    this._pollers = {}
  }

  /**
   * Create a poller descriptor from externalsecret resources.
   * @param {Object} object - externalsecret manifest.
   * @returns {Object} Poller descriptor.
   */
  _createPollerDescriptor (externalSecret) {
    const { uid, name, namespace } = externalSecret.metadata

    return { id: uid, name, namespace, externalSecret }
  }

  /**
   * Remove a poller associated with a deleted or modified externalsecret.
   * @param {String} pollerId - ID of the poller to remove.
   */
  _removePoller (pollerId) {
    if (this._pollers[pollerId]) {
      this._logger.debug(`stopping and removing poller ${pollerId}`)
      this._pollers[pollerId].stop()
      delete this._pollers[pollerId]
    }
  }

  _removePollers () {
    Object.keys(this._pollers).forEach(pollerId => this._removePoller(pollerId))
  }

  _addPoller (descriptor) {
    this._logger.debug(`spinning up poller for ${descriptor.namespace}/${descriptor.name}`)

    const poller = this._pollerFactory.createPoller(descriptor)

    this._pollers[descriptor.id] = poller.start()
  }

  /**
   * Start daemon and create pollers.
   */
  async start () {
    for await (const event of this._externalSecretEvents) {
      const descriptor = event.object ? this._createPollerDescriptor(event.object) : null

      switch (event.type) {
        case 'DELETED': {
          this._removePoller(descriptor.id)
          break
        }

        case 'ADDED':
        case 'MODIFIED': {
          this._removePoller(descriptor.id)
          this._addPoller(descriptor)
          break
        }

        case 'DELETED_ALL': {
          this._removePollers()
          break
        }

        default: {
          this._logger.warn(event, 'Unhandled event type %s', event.type)
          break
        }
      }
    }
  }

  /**
   * Destroy pollers and stop deamon.
   */
  stop () {
    this._removePollers()
    this._externalSecretEvents.return(null)
  }
}

module.exports = Daemon
