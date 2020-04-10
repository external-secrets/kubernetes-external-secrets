/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const CustomResourceManager = require('./custom-resource-manager')

describe('CustomResourceManager', () => {
  let customResourceManager
  let fakeCustomResource
  let fakeCustomResourceManifest
  let kubeClientMock
  let loggerMock
  let v1beta1Mock

  beforeEach(() => {
    fakeCustomResource = {
      body: {
        metadata: {
          name: 'fakeName',
          resourceVersion: 'fakeResourceVersion'
        }
      }
    }
    fakeCustomResourceManifest = {
      kind: 'CustomResourceDefinition',
      metadata: {
        name: 'fakeName'
      }
    }
    v1beta1Mock = sinon.mock()
    v1beta1Mock.customresourcedefinitions = sinon.stub()
    kubeClientMock = sinon.mock()
    kubeClientMock.apis = sinon.mock()
    kubeClientMock.apis['apiextensions.k8s.io'] = sinon.mock()
    kubeClientMock.apis['apiextensions.k8s.io'].v1beta1 = v1beta1Mock
    loggerMock = sinon.mock()
    customResourceManager = new CustomResourceManager({
      kubeClient: kubeClientMock,
      logger: loggerMock,
      disabled: false
    })
  })

  describe('_createResource', () => {
    it('creates custom resource', async () => {
      v1beta1Mock.customresourcedefinitions.post = sinon.stub().resolves()

      await customResourceManager._createResource({
        customResourceManifest: fakeCustomResourceManifest
      })

      expect(v1beta1Mock.customresourcedefinitions.post.calledWith({
        body: fakeCustomResourceManifest
      })).to.equal(true)
    })
  })

  describe('_getResource', () => {
    it('gets custom resource', async () => {
      v1beta1Mock.customresourcedefinitions
        .returns(v1beta1Mock.customresourcedefinitions)
      v1beta1Mock.customresourcedefinitions.get = sinon.stub()
        .resolves(fakeCustomResource)

      const fakeResourceName = fakeCustomResourceManifest.metadata.name

      const customResource = await customResourceManager._getResource({
        resourceName: fakeResourceName
      })

      expect(customResource).deep.equals(fakeCustomResource)
      expect(v1beta1Mock.customresourcedefinitions
        .calledWith(fakeResourceName)).to.equal(true)
      expect(v1beta1Mock.customresourcedefinitions.get.called).to.equal(true)
    })
  })

  describe('_updateResource', () => {
    it('updates custom resource', async () => {
      v1beta1Mock.customresourcedefinitions
        .returns(v1beta1Mock.customresourcedefinitions)
      v1beta1Mock.customresourcedefinitions.put = sinon.stub().resolves()

      const fakeResourceName = fakeCustomResourceManifest.metadata.name

      await customResourceManager._updateResource({
        customResource: fakeCustomResource,
        customResourceManifest: fakeCustomResourceManifest
      })

      // NOTE(jdaeli): no need to deep clone here since
      // we create the object before each test
      const fakeResourceVersion = fakeCustomResource.body.metadata.resourceVersion
      fakeCustomResourceManifest.metadata.resourceVersion = fakeResourceVersion

      expect(v1beta1Mock.customresourcedefinitions.calledWith(fakeResourceName))
        .to.equal(true)
      expect(v1beta1Mock.customresourcedefinitions.put.calledWith({
        body: fakeCustomResourceManifest
      })).to.equal(true)
    })
  })

  describe('_upsertResource', () => {
    beforeEach(() => {
      sinon.stub(customResourceManager, '_createResource')
      sinon.stub(customResourceManager, '_getResource')
      sinon.stub(customResourceManager, '_updateResource')
      kubeClientMock.addCustomResourceDefinition = sinon.stub()
      loggerMock.info = sinon.stub()
    })

    it('creates custom resource', async () => {
      customResourceManager._createResource.resolves()

      const fakeResourceName = fakeCustomResourceManifest.metadata.name
      const logInfoMsg = `Upserting custom resource ${fakeResourceName}`

      await customResourceManager._upsertResource({
        customResourceManifest: fakeCustomResourceManifest
      })

      expect(loggerMock.info.calledWith(logInfoMsg))
      expect(customResourceManager._createResource.calledWith({
        customResourceManifest: fakeCustomResourceManifest
      })).to.equal(true)
      expect(customResourceManager._getResource.called).to.equal(false)
      expect(customResourceManager._updateResource.called).to.equal(false)
    })

    it('updates custom resource', async () => {
      const conflictError = new Error('fake conflict error')
      conflictError.statusCode = 409

      customResourceManager._createResource.throws(conflictError)
      customResourceManager._getResource.resolves(fakeCustomResource)
      customResourceManager._updateResource.resolves()
      sinon.stub(customResourceManager, '_sleep').resolves()

      const fakeResourceName = fakeCustomResourceManifest.metadata.name

      await customResourceManager._upsertResource({
        customResourceManifest: fakeCustomResourceManifest
      })

      expect(customResourceManager._getResource.calledWith({
        resourceName: fakeResourceName
      })).to.equal(true)
      expect(customResourceManager._updateResource.calledWith({
        customResource: fakeCustomResource,
        customResourceManifest: fakeCustomResourceManifest
      })).to.equal(true)
      expect(customResourceManager._sleep.called).to.equal(false)
    })
  })

  describe('managerCrd', () => {
    beforeEach(() => {
      sinon.stub(customResourceManager, '_upsertResource')
      kubeClientMock.addCustomResourceDefinition = sinon.stub()
      loggerMock.info = sinon.stub()
    })

    it('upsert when enabled', async () => {
      await customResourceManager.manageCrd({
        customResourceManifest: fakeCustomResourceManifest
      })
      const updatingMsg = 'updating CRD'
      const successfulMsg = 'successfully updated CRD'

      expect(loggerMock.info.calledWith(updatingMsg)).to.equal(true)
      expect(loggerMock.info.calledWith(successfulMsg)).to.equal(true)
      expect(customResourceManager._upsertResource.calledWith({
        customResourceManifest: fakeCustomResourceManifest
      })).to.equal(true)
      expect(kubeClientMock.addCustomResourceDefinition.calledWith(fakeCustomResourceManifest)).to.equal(true)
    })

    it('do nothing when disabled', async () => {
      customResourceManager.disabled = true
      const disabledMsg = 'Custom resource manager has been disabled, CRD will not be managed.'

      await customResourceManager.manageCrd({
        customResourceManifest: fakeCustomResourceManifest
      })

      expect(loggerMock.info.calledWith(disabledMsg)).to.equal(true)
      expect(customResourceManager._upsertResource.calledWith({
        customResourceManifest: fakeCustomResourceManifest
      })).to.equal(false)
      expect(kubeClientMock.addCustomResourceDefinition.calledWith(fakeCustomResourceManifest)).to.equal(true)
    })
  })
})
