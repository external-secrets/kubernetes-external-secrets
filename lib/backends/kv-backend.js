'use strict';

const AbstractBackend = require('./abstract-backend');

/** Key Value backend class. */
class KVBackend extends AbstractBackend {
  /**
   * Create a Key Value backend.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor({ logger }) {
    super();
    this._logger = logger;
  }

  /**
   * Fetch Kubernetes secret property values.
   * @param {Object[]} secretProperties - Kubernetes secret properties.
   * @param {string} secretProperties[].key - Secret key in the backend.
   * @param {string} secretProperties[].name - Kubernetes Secret property name.
   * @param {string} secretProperties[].property - If the backend secret is an
   *   object, this is the property name of the value to use.
   * @returns {Promise} Promise object representing secret property values.
   */
  _fetchSecretPropertyValues({ secretProperties }) {
    return Promise.all(secretProperties.map(async secretProperty => {
      this._logger.info(`fetching secret property ${secretProperty.name}`);
      const value = await this._get({ secretKey: secretProperty.key });

      if ('property' in secretProperty) {
        return value[secretProperty.property];
      }
      return value;
    }));
  }

  /**
   * Get a secret property value from Key Value backend.
   */
  _get() {
    throw new Error('_get not implemented');
  }

  /**
   * Fetch Kubernetes secret manifest data.
   * @param {SecretDescriptor} secretDescriptor - Kubernetes secret descriptor.
   * @returns {Promise} Promise object representing Kubernetes secret manifest data.
   */
  async getSecretManifestData({ secretDescriptor }) {
    const data = {};
    const secretPropertyValues = await this._fetchSecretPropertyValues({
      secretProperties: secretDescriptor.properties
    });
    secretDescriptor.properties.forEach((secretProperty, index) => {
      data[secretProperty.name] = (Buffer.from(secretPropertyValues[index], 'utf8')).toString('base64');
    });
    return data;
  }
}

module.exports = KVBackend;
