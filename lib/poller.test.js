/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

describe('Poller', () => {
  let backendMock
  let kubeClientMock
  let loggerMock
  let pollerFactory

  const ownerReference = {
    apiVersion: 'owner-api/v1',
    controller: true,
    kind: 'MyKind',
    name: 'fakeSecretName',
    uid: '4c10d879-2646-40dc-8595-d0b06b60a9ed'
  }

  beforeEach(() => {
    backendMock = sinon.mock()
    kubeClientMock = sinon.mock()
    loggerMock = sinon.mock()

    loggerMock.info = sinon.stub()
    loggerMock.error = sinon.stub()

    pollerFactory = (secretDescriptor = {
      backendType: 'fakeBackendType',
      name: 'fakeSecretName',
      properties: [
        'fakePropertyName1',
        'fakePropertyName2'
      ]
    }) => new Poller({
      secretDescriptor,
      backends: {
        fakeBackendType: backendMock
      },
      intervalMilliseconds: 5000,
      kubeClient: kubeClientMock,
      logger: loggerMock,
      namespace: 'fakeNamespace',
      ownerReference
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('_createSecretManifest', () => {
    beforeEach(() => {
      backendMock.getSecretManifestData = sinon.stub()
    })

    it('creates secret manifest', async () => {
      const poller = pollerFactory({
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        properties: [
          'fakePropertyName1',
          'fakePropertyName2'
        ]
      })

      backendMock.getSecretManifestData.resolves({
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
      })

      const secretManifest = await poller._createSecretManifest()

      expect(backendMock.getSecretManifestData.calledWith({
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          properties: [
            'fakePropertyName1',
            'fakePropertyName2'
          ]
        }
      })).to.equal(true)

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName',
          ownerReferences: [ownerReference]
        },
        type: 'Opaque',
        data: {
          fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
          fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
        }
      })
    })
  })

  describe('_poll', () => {
    let poller
    beforeEach(() => {
      poller = pollerFactory({
        backendType: 'fakeBackendType',
        name: 'fakeSecretName1',
        properties: ['fakePropertyName1', 'fakePropertyName2']
      })
      poller._upsertKubernetesSecret = sinon.stub()
    })

    it('polls secrets', async () => {
      poller._upsertKubernetesSecret.resolves()

      await poller._poll()

      expect(loggerMock.info.calledWith('running poll')).to.equal(true)
      expect(poller._upsertKubernetesSecret.calledWith()).to.equal(true)
    })

    it('logs error if storing secret operation fails', async () => {
      poller._upsertKubernetesSecret.throws(new Error('fake error message'))

      await poller._poll()

      expect(loggerMock.error.calledWith('failure while polling the secrets')).to.equal(true)
    })
  })

  describe('_upsertKubernetesSecret', () => {
    let kubeNamespaceMock
    let poller

    beforeEach(() => {
      poller = pollerFactory({
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        properties: ['fakePropertyName']
      })
      kubeNamespaceMock = sinon.mock()
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeNamespaceMock)
      kubeClientMock.api = sinon.mock()
      kubeClientMock.api.v1 = sinon.mock()
      kubeClientMock.api.v1.namespaces = sinon.stub().returns(kubeNamespaceMock)
      poller._createSecretManifest = sinon.stub().returns({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName'
        },
        type: 'Opaque',
        data: {
          fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
        }
      })
    })

    it('creates new secret', async () => {
      kubeNamespaceMock.secrets.post = sinon.stub().resolves()

      await poller._upsertKubernetesSecret()

      expect(kubeNamespaceMock.secrets.post.calledWith({
        body: {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'fakeSecretName'
          },
          type: 'Opaque',
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })).to.equal(true)
    })

    it('updates secret', async () => {
      const conflictError = new Error('Conflict')
      conflictError.statusCode = 409
      kubeNamespaceMock.secrets.post = sinon.stub().throws(conflictError)
      kubeNamespaceMock.put = sinon.stub().resolves()

      await poller._upsertKubernetesSecret()

      expect(kubeNamespaceMock.secrets.calledWith('fakeSecretName')).to.equal(true)

      expect(kubeNamespaceMock.put.calledWith({
        body: {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'fakeSecretName'
          },
          type: 'Opaque',
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })).to.equal(true)
    })

    it('fails storing secret', async () => {
      const internalErrorServer = new Error('Internal Error Server')
      internalErrorServer.statusCode = 500

      kubeNamespaceMock.secrets.post = sinon.stub().throws(internalErrorServer)

      let error

      try {
        await poller._upsertKubernetesSecret()
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('Internal Error Server')
    })
  })

  describe('start', () => {
    let clock
    let poller

    beforeEach(() => {
      poller = pollerFactory()
      clock = sinon.useFakeTimers()
      poller._poll = sinon.stub()
    })

    afterEach(() => {
      poller.stop()
      clock.restore()
    })

    it('starts poller', async () => {
      expect(poller._interval).to.equal(null)
      poller.start({ forcePoll: true })
      clock.tick(poller._intervalMilliseconds)
      expect(loggerMock.info.calledWith('starting poller')).to.equal(true)
      expect(poller._interval).to.not.equal(null)
      expect(poller._poll.called).to.equal(true)
    })
  })

  describe('stop', () => {
    let clock
    let poller

    beforeEach(() => {
      poller = pollerFactory()
      clock = sinon.useFakeTimers()
      poller._poll = sinon.stub()
    })

    afterEach(() => {
      clock.restore()
    })

    it('stops poller', async () => {
      poller.start({ forcePoll: true })
      poller.stop()
      expect(loggerMock.info.calledWith('stopping poller')).to.equal(true)
      expect(poller._interval).to.equal(null)
    })
  })
})
