/* eslint-env mocha */
'use strict'

const { expect } = require('chai')

const {
  kubeClient,
  customResourceManifest
} = require('../../config')

const {
  uuid
} = require('./framework.js')

describe('CRD', () => {
  it('should register the CRD on startup', async () => {
    const res = await kubeClient
      .apis['apiextensions.k8s.io']
      .v1beta1
      .customresourcedefinitions(customResourceManifest.metadata.name)
      .get()
    expect(res).to.not.equal(undefined)
    expect(res.statusCode).to.equal(200)
  })

  it('should reject invalid ExternalSecret manifests', async () => {
    kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({ body: {
        apiVersion: 'kubernetes-client.io/v1',
        kind: 'ExternalSecret',
        metadata: {
          name: `e2e-test-validation-${uuid}`
        },
        secretDescriptor: {
          backendType: 'systemManager',
          data: [
            {
              key: `/e2e/${uuid}/name`,
              name: 'name'
            }
          ]
        }
      } })
      .catch(err => expect(err).to.be.an('error'))
  })
})
