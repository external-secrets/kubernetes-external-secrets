'use strict'

const AbstractBackend = require('./abstract-backend')

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
   * @param {string} data[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @param {string} roleArn - If the client should assume a role before fetching the secret
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchSecretPropertyValues ({ data, roleArn }) {
    return Promise.all(data.map(async secretProperty => {
      this._logger.info(`fetching secret property ${secretProperty.name} with role: ${roleArn || 'no role set'}`)
      const plainOrObjValue = await this._get({ secretKey: secretProperty.key, roleArn })
      const shouldParseValue = 'property' in secretProperty

      let value = plainOrObjValue
      if (shouldParseValue) {
        let parsedValue
        try {
          parsedValue = JSON.parse(value)
        } catch (err) {
          this._logger.warn(`Failed to JSON.parse value for '${secretProperty.key}',` +
           ` please verify that your secret value is correctly formatted as JSON.` +
           ` To use plain text secret remove the 'property: ${secretProperty.property}'`)
          return
        }

        if (!(secretProperty.property in parsedValue)) {
          throw new Error(`Could not find property ${secretProperty.property} in ${secretProperty.key}`)
        }

        value = parsedValue[secretProperty.property]
      }

      return { [secretProperty.name]: value }
    }))
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {string[]} dataFrom - Array of secret keys in the backend
   * @param {string} roleArn - If the client should assume a role before fetching the secret
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchDataFromValues ({ dataFrom, roleArn }) {
    return Promise.all(dataFrom.map(async secretKey => {
      this._logger.info(`fetching secret ${secretKey} with role: ${roleArn || 'no role set'}`)
      const value = await this._get({ secretKey, roleArn })

      try {
        return JSON.parse(value)
      } catch (err) {
        this._logger.warn(`Failed to JSON.parse value for '${secretKey}',` +
           ` please verify that your secret value is correctly formatted as JSON.`)
      }
    }))
  }

  /**
   * Get a secret property value from Key Value backend.
   */
  _get () {
    throw new Error('_get not implemented')
  }

  /**
   * Fetch Kubernetes secret manifest data.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret descriptor.
   * @returns {Promise} Promise object representing Kubernetes secret manifest data.
   */
  async getSecretManifestData ({
    secretDescriptor: {
      // Use secretDescriptor.properties to be backwards compatible.
      properties = [],
      data = properties,
      dataFrom = [],
      roleArn
    }
  }) {
    const [dataFromValues, dataValues] = await Promise.all([
      this._fetchDataFromValues({ dataFrom, roleArn }),
      this._fetchSecretPropertyValues({ data, roleArn })
    ])

    const plainValues = dataFromValues.concat(dataValues)
      .reduce((acc, parsedValue) => ({
        ...acc,
        ...parsedValue
      }), {})

    const encodedEntries = Object.entries(plainValues)
      .map(([name, plainValue]) => [
        name,
        (Buffer.from(`${plainValue}`, 'utf8')).toString('base64')
      ])

    return Object.fromEntries(encodedEntries)
  }
}

module.exports = KVBackend
