'use strict'

const AbstractBackend = require('./abstract-backend')
const { get, hasIn } = require('lodash')

/** Key Value backend class. */
class KVBackend extends AbstractBackend {
  /**
   * Create a Key Value backend.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor ({ logger }) {
    super()
    this._logger = logger
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {Object[]} data - Kubernetes secret properties.
   * @param {string} data[].key - Secret key in the backend.
   * @param {string} data[].name - Kubernetes Secret property name.
   * @param {string} data[].path - Kubernetes Secret path to fetch keys from.
   * @param {string} data[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @param {string} data[].isBinary - If the backend secret shall be treated
   *   as binary data represented by a base64-encoded string. Defaults to false.
   * @param {Object} specOptions - Options set on spec level.
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataValues ({ data, specOptions }) {
    return Promise.all(data.map(async dataItem => {
      const { name, property = null, key, path, ...keyOptions } = dataItem

      let response = {}
      let plainOrObjValue

      // Supporting fetching by key or by path
      // If 'path' is not defined, we can assume 'key' will exist due to CRD validation
      let singleParameterKey = true
      if (path) { singleParameterKey = false }

      if (singleParameterKey) {
        // Single secret
        plainOrObjValue = await this._get({ key, keyOptions, specOptions })
      } else {
        // All secrets inside the specified path
        plainOrObjValue = await this._getByPath({ path, keyOptions, specOptions })
      }

      const shouldParseValue = 'property' in dataItem
      const isBinary = 'isBinary' in dataItem && dataItem.isBinary === true

      let value = plainOrObjValue
      if (shouldParseValue) {
        let parsedValue
        try {
          parsedValue = JSON.parse(value)
        } catch (err) {
          this._logger.warn(`Failed to JSON.parse value for '${key}',` +
            ' please verify that your secret value is correctly formatted as JSON.' +
            ` To use plain text secret remove the 'property: ${property}'`)
          return
        }

        if (!(hasIn(parsedValue, property))) {
          throw new Error(`Could not find property ${property} in ${key}`)
        }

        value = get(parsedValue, property)
      }

      if (isBinary) {
        // value in the backend is binary data which is already encoded in base64.
        if (typeof value === 'string') {
          // Skip this step if the value from the backend is not a string (e.g., AWS
          // SecretsManager will already return a `Buffer` with base64 encoding if the
          // secret contains `SecretBinary` instead of `SecretString`).
          value = Buffer.from(value, 'base64')
        }
      }

      if (singleParameterKey) {
        // Not path, return as is
        response = { [name]: value }
      } else {
        // Returning dict with path keys and values
        for (const records in value) {
          response[records] = value[records]
        }
      }

      return response
    }))
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {string[]} dataFrom - Array of secret keys in the backend
   * @param {string} specOptions - Options set on spec level that might be interesting for the backend
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataFromValues ({ dataFrom, specOptions }) {
    return Promise.all(dataFrom.map(async key => {
      const value = await this._get({ key, specOptions, keyOptions: {} })

      try {
        return JSON.parse(value)
      } catch (err) {
        this._logger.warn(`Failed to JSON.parse value for '${key}',` +
          ' please verify that your secret value is correctly formatted as JSON.')
      }
    }))
  }

  /**
   * Fetch Kubernetes secret property values with options.
   * @param {Object[]} dataFromWithOptions - Array of secret keys in the backend, including extra options
   * @param {string} specOptions - Options set on spec level that might be interesting for the backend
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataFromValuesWithOptions ({ dataFromWithOptions, specOptions }) {
    return Promise.all(dataFromWithOptions.map(async dataItem => {
      const { key, ...keyOptions } = dataItem
      const value = await this._get({ key, specOptions, keyOptions })

      try {
        return JSON.parse(value)
      } catch (err) {
        this._logger.warn(`Failed to JSON.parse value for '${dataItem}',` +
          ' please verify that your secret value is correctly formatted as JSON.')
      }
    }))
  }

  /**
   * Get a secret property value from Key Value backend.
   * @param {string} key - Secret key in the backend.
   * @param {string} keyOptions - Options for this specific key, eg version etc.
   * @param {string} specOptions - Options for this external secret, eg role
   * @returns {Promise} Promise object representing secret property values.
   */
  _get ({ key, keyOptions, specOptions }) {
    throw new Error('_get not implemented')
  }

  /**
   * Get a secret property value from Key Value backend.
   * @param {string} path - Path from where to fetch secrets on the backend.
   * @param {string} keyOptions - Options for this specific key, eg version etc.
   * @param {string} specOptions - Options for this external secret, eg role
   * @returns {Promise} Promise object representing secret property values.
   */
  _getByPath ({ path, keyOptions, specOptions }) {
    throw new Error('_getByPath not implemented')
  }

  /**
   * Convert secret value to buffer
   * @param {(string|Buffer|object)} plainValue - plain secret value
   * @returns {Buffer} Buffer containing value
   */
  _toBuffer (plainValue) {
    if (plainValue instanceof Buffer) {
      return plainValue
    }

    if (typeof plainValue === 'object') {
      return Buffer.from(JSON.stringify(plainValue), 'utf-8')
    }

    return Buffer.from(`${plainValue}`, 'utf8')
  }

  /**
   * Fetch Kubernetes secret manifest data.
   * @param {ExternalSecretSpec} spec - Kubernetes ExternalSecret spec.
   * @returns {Promise} Promise object representing Kubernetes secret manifest data.
   */
  async getSecretManifestData ({
    spec: {
      // Use properties to be backwards compatible.
      properties = [],
      data = properties,
      dataFrom = [],
      dataFromWithOptions = [],
      ...specOptions
    }
  }) {
    const [dataFromValues, dataFromValuesWithOptions, dataValues] = await Promise.all([
      this._fetchDataFromValues({ dataFrom, specOptions }),
      this._fetchDataFromValuesWithOptions({ dataFromWithOptions, specOptions }),
      this._fetchDataValues({ data, specOptions })
    ])

    const plainValues = dataFromValues.concat(dataFromValuesWithOptions).concat(dataValues)
      .reduce((acc, parsedValue) => ({
        ...acc,
        ...parsedValue
      }), {})

    const encodedEntries = Object.entries(plainValues)
      .map(([name, plainValue]) => [
        name,
        this._toBuffer(plainValue).toString('base64')
      ])

    return Object.fromEntries(encodedEntries)
  }
}

module.exports = KVBackend
