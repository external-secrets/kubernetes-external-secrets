'use strict'

/* eslint-disable no-console */

const Poller = require('./poller')

/** Daemon class. */
class Daemon {
  /**
   * Create daemon.
   * @param {Object} backends - Backends for fetching secret properties.
   * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
   * @param {Object} externalSecretEvents - Stream of external secret events.
   * @param {Object} logger - Logger for logging stuff.
   * @param {number} pollerIntervalMilliseconds - Interval time in milliseconds for polling secret properties.
   */
  constructor ({
    backends,
    externalSecretEvents,
    kubeClient,
    logger,
    pollerIntervalMilliseconds
  }) {
    this._backends = backends
    this._kubeClient = kubeClient
    this._externalSecretEvents = externalSecretEvents
    this._logger = logger
    this._pollerIntervalMilliseconds = pollerIntervalMilliseconds

    this._pollers = {}
  }

  /**
   * Create a poller descriptor from externalsecret resources.
   * @param {Object} object - externalsecret manifest.
   * @returns {Object} Poller descriptor.
   */
  _createPollerDescriptor (externalSecret) {
    const { uid, name, namespace } = externalSecret.metadata
    // NOTE(jdaeli): hash this in case resource version becomes too long?
    const secretDescriptor = { ...externalSecret.secretDescriptor, name }
    const ownerReference = {
      apiVersion: externalSecret.apiVersion,
      controller: true,
      kind: externalSecret.kind,
      name,
      uid
    }

    return { id: uid, namespace, secretDescriptor, ownerReference }
  }

  /**
   * Remove a poller associated with a deleted or modified externalsecret.
   * @param {String} pollerId - ID of the poller to remove.
   */
  _removePoller (pollerId) {
    if (this._pollers[pollerId]) {
      this._logger.info(`stopping and removing poller ${pollerId}`)
      this._pollers[pollerId].stop()
      delete this._pollers[pollerId]
    }
  }

  _removePollers () {
    Object.keys(this._pollers).forEach(pollerId => this._removePoller(pollerId))
  }

  _addPoller (descriptor, forcePoll = false) {
    this._logger.info('spinning up poller', descriptor)

    const poller = new Poller({
      backends: this._backends,
      intervalMilliseconds: this._pollerIntervalMilliseconds,
      kubeClient: this._kubeClient,
      logger: this._logger,
      namespace: descriptor.namespace,
      secretDescriptor: descriptor.secretDescriptor,
      ownerReference: descriptor.ownerReference
    })

    this._pollers[descriptor.id] = poller.start({ forcePoll })
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

        case 'ADDED': {
          this._addPoller(descriptor)
          break
        }

        case 'MODIFIED': {
          this._removePoller(descriptor.id)
          this._addPoller(descriptor, true)
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
