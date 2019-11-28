'use strict'

const AbstractBackend = require('./abstract-backend')

/** Key Value backend class. */
class KVBackend extends AbstractBackend {
  /**
   * Create a Key Value backend.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor({ logger }) {
    super()
    this._logger = logger
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {Object[]} data - Kubernetes secret properties.
   * @param {string} data[].key - Secret key in the backend.
   * @param {string} data[].path - Path from where to fetch keys in the backend.
   * @param {string} data[].name - Kubernetes Secret property name.
   * @param {string} data[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @param {Object} specOptions - Options set on spec level.
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataValues({ data, specOptions }) {
    return Promise.all(data.map(async dataItem => {
      const { name, property = null, path, key, ...keyOptions } = dataItem
      const plainOrObjValue = await this._get({ path, specOptions })
      const shouldParseValue = 'property' in dataItem

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

        if (!(property in parsedValue)) {
          throw new Error(`Could not find property ${property} in ${key}`)
        }
        value = parsedValue[property]
      }

      if (path) { // MORE THAN ONE PARAMETER
        return value
      } else {
        return { [name]: value }
      }

    }))
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {string[]} dataFrom - Array of secret keys in the backend
   * @param {string} specOptions - Options set on spec level that might be interesting for the backend
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataFromValues({ dataFrom, specOptions }) {
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
   * Get a secret property value from Key Value backend.
   * @param {string} key - Secret key in the backend.
   * @param {string} keyOptions - Options for this specific key, eg version etc.
   * @param {string} specOptions - Options for this external secret, eg role
   * @returns {Promise} Promise object representing secret property values.
   */
  _get({ key, keyOptions, specOptions }) {
    throw new Error('_get not implemented')
  }

  /**
   * Fetch Kubernetes secret manifest data.
   * @param {ExternalSecretSpec} spec - Kubernetes ExternalSecret spec.
   * @returns {Promise} Promise object representing Kubernetes secret manifest data.
   */
  async getSecretManifestData({
    spec: {
      // Use properties to be backwards compatible.
      properties = [],
      data = properties,
      dataFrom = [],
      ...specOptions
    }
  }) {
    const [dataFromValues, dataValues] = await Promise.all([
      this._fetchDataFromValues({ dataFrom, specOptions }),
      this._fetchDataValues({ data, specOptions })
    ])

    const plainValues = dataFromValues.concat(dataValues)
      .reduce((acc, parsedValue) => ({
        ...acc,
        ...parsedValue
      }), {})

    var encodedEntries = []

    if (dataValues[0]) { // MORE THAN ONE PARAMETER IS COMING
      encodedEntries = Object.entries(dataValues[0])
        .map(([key]) => [
          require('path').basename(dataValues[0][key].key),
          (Buffer.from(`${dataValues[0][key].value}`, 'utf8')).toString('base64')
        ]);
    } else {
      encodedEntries = Object.entries(dataValues)
        .map(([name, value]) => [
          name,
          (Buffer.from(`${value}`, 'utf8')).toString('base64')
        ])
    }

    return Object.fromEntries(encodedEntries)
  }
}

module.exports = KVBackend
