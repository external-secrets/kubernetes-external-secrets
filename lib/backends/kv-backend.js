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
   * @param {Object[]} secretProperties - Kubernetes secret properties.
   * @param {string} secretProperties[].key - Secret key in the backend.
   * @param {string} secretProperties[].name - Kubernetes Secret property name.
   * @param {string} secretProperties[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @param {string} secretProperties[].roleArn - If the client should assume a role before fetching the secret
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchSecretPropertyValues ({ externalData, roleArn }) {
    return Promise.all(externalData.map(async secretProperty => {
      this._logger.info(`fetching secret property ${secretProperty.name} with role: ${roleArn}`)
      const value = await this._get({ secretKey: secretProperty.key, roleArn })

      if ('property' in secretProperty || !('name' in secretProperty)) {
        let parsedValue
        try {
          parsedValue = JSON.parse(value)
        } catch (err) {
          this._logger.warn(`Failed to JSON.parse value for '${secretProperty.key}',` +
           ` please verify that your secret value is correctly formatted as JSON.` +
           ` To use plain text secret remove the 'property: ${secretProperty.property}'`)
          return
        }

        if (!('name' in secretProperty)) {
          return parsedValue
        } else if (!(secretProperty.property in parsedValue)) {
          throw new Error(`Could not find property ${secretProperty.property} in ${secretProperty.key}`)
        }

        return parsedValue[secretProperty.property]
      }

      return value
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
  async getSecretManifestData ({ secretDescriptor }) {
    const data = {}
    // Use secretDescriptor.properties to be backwards compatible.
    const externalData = secretDescriptor.data || secretDescriptor.properties
    const secretPropertyValues = await this._fetchSecretPropertyValues({
      externalData,
      roleArn: secretDescriptor.roleArn
    })
    externalData.forEach((secretProperty, index) => {
      if (!('property' in secretProperty) && 'name' in secretProperty) {
        const value = secretPropertyValues[index]
        secretPropertyValues[index] = {}
        secretPropertyValues[index][secretProperty.name] = value
      }

      Object.keys(secretPropertyValues[index]).forEach(key => {
        data[key] = (Buffer.from(secretPropertyValues[index][key], 'utf8')).toString('base64')
      })
    })
    return data
  }
}

module.exports = KVBackend
