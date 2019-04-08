'use strict'

/** Abstract backend class. */
class AbstractBackend {
  /**
   * Fetch Kubernetes secret manifest data.
   */
  getSecretManifestData () {
    throw new Error('getSecretManifestData not implemented')
  }
}

module.exports = AbstractBackend
