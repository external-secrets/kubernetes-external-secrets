'use strict';

const clonedeep = require('lodash.clonedeep');

const SLEEP_MILLISECONDS = 1000;

/** Custom resource manager class. */
class CustomResourceManager {
  /**
   * Create custom resource manager.
   * @param {Object} kubeClient - Client for interacting with kubernetes cluster.
   * @param {Object} logger - Logger for logging stuff.
   */
  constructor({ kubeClient, logger }) {
    this._kubeClient = kubeClient;
    this._logger = logger;
  }

  /**
   * Create custom resource in kubernetes cluster.
   * @param {Object} customResourceManifest - Custom resource manifest.
   * @returns {Promise} Promise object representing operation result.
   */
  _createResource({ customResourceManifest }) {
    return this._kubeClient
      .apis['apiextensions.k8s.io']
      .v1beta1
      .customresourcedefinitions
      .post({ body: customResourceManifest });
  }

  /**
   * Get custom resource from kubernetes cluster.
   * @param {string} resourceName - Custom resource name.
   * @returns {Promise} Promise object representing custom resource.
   */
  _getResource({ resourceName }) {
    return this._kubeClient
      .apis['apiextensions.k8s.io']
      .v1beta1
      .customresourcedefinitions(resourceName)
      .get();
  }

  /**
   * Update a custom resource in kubernetes cluster.
   * @param {Object} customResource - Custom resource.
   * @param {Object} customResourceManifest - Custom resource manifest.
   * @returns {Promise} Promise object representing operation result.
   */
  _updateResource({ customResource, customResourceManifest }) {
    const resourceVersion = customResource.body.metadata.resourceVersion;
    const resourceName = customResource.body.metadata.name;

    const body = clonedeep(customResourceManifest);
    body.metadata.resourceVersion = resourceVersion;

    return this._kubeClient
      .apis['apiextensions.k8s.io']
      .v1beta1
      .customresourcedefinitions(resourceName)
      .put({ body });
  }

  /**
   * Block asynchronous flow.
   * @param {number} milliseconds - Number of milliseconds to block flow operation.
   * @returns {Promise} Promise object representing block flow operation.
   */
  _sleep({ milliseconds }) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Create or update custom resource in kubernetes cluster.
   * @param {Object} customResourceManifest - Custom resource manifest.
   * @returns {Promise} Promise object representing operation result.
   */
  async upsertResource({ customResourceManifest }) {
    const resourceName = customResourceManifest.metadata.name;
    this._logger.info(`Upserting custom resource ${resourceName}`);

    this._kubeClient.addCustomResourceDefinition(customResourceManifest);

    // try to create the CRD at first
    try {
      return await this._createResource({ customResourceManifest });
    } catch (err) {
      // re-throw the error if request failed for a reason
      // other than 409 conflict "exists"
      if (err.statusCode !== 409) throw err;
    }

    for (let attempt = 0; attempt <= 5; attempt++) {
      try {
        const customResource = await this._getResource({ resourceName });
        return await this._updateResource({ customResource, customResourceManifest });
      } catch (err) {
        if (err.statusCode !== 409) throw err;
      }

      await this._sleep({ milliseconds: SLEEP_MILLISECONDS });
    }

    throw new Error(`Unable to update resource ${resourceName}`);
  }
}

module.exports = CustomResourceManager;
