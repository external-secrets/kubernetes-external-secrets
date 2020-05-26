'use strict'

const NodeCache = require('node-cache')
var hash = require('object-hash')

/** ObjectCache class. */
class ObjectCache {
  /**
   * Create Object Cache
   * @param {number} backendCacheDurationSeconds  - Duration in seconds to save keys in the cache
   */
  constructor (backendCacheDurationSeconds) {
    this._cache = new NodeCache({ stdTTL: backendCacheDurationSeconds / 1000 })
  }

  /**
   * Set object in the cache
   */
  set (object) {
    const objectHash = hash(object)
    this._cache.set(objectHash)
  }

  /**
   * Get object from the cache
   */
  get (object) {
    const objectHash = hash(object)
    return this._cache.get(objectHash)
  }
}

module.exports = ObjectCache
