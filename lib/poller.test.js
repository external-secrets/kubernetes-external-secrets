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

    it('creates secret manifest - no type (backwards compat)', async () => {
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

    it('creates secret manifest - with type', async () => {
      const poller = pollerFactory({
        type: 'dummy-test-type',
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
          type: 'dummy-test-type',
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
        type: 'dummy-test-type',
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
      expect(loggerMock.info.calledWith(`running poll on the secret ${poller._secretDescriptor.name}`)).to.equal(true)
      expect(poller._upsertKubernetesSecret.calledWith()).to.equal(true)
    })

    it('logs error if storing secret operation fails', async () => {
      const error = new Error('fake error message')
      poller._upsertKubernetesSecret.throws(error)

      await poller._poll()
      expect(loggerMock.error.calledWith(error, `failure while polling the secret ${poller._secretDescriptor.name}`)).to.equal(true)
    })
  })

  describe('_upsertKubernetesSecret', () => {
    let kubeNamespaceMock
    let poller
    let fakeNamespace

    beforeEach(() => {
      poller = pollerFactory({
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        properties: ['fakePropertyName']
      })
      fakeNamespace = {
        body: {
          metadata: {
            annotations: {}
          }
        }
      }
      kubeNamespaceMock = sinon.mock()
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeNamespaceMock)
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)
      kubeClientMock.api = sinon.mock()
      kubeClientMock.api.v1 = sinon.mock()
      kubeClientMock.api.v1.namespaces = sinon.stub().returns(kubeNamespaceMock)
      poller._createSecretManifest = sinon.stub().returns({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName'
        },
        type: 'some-type',
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
          type: 'some-type',
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
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)

      await poller._upsertKubernetesSecret()

      expect(kubeNamespaceMock.secrets.calledWith('fakeSecretName')).to.equal(true)

      expect(kubeNamespaceMock.put.calledWith({
        body: {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'fakeSecretName'
          },
          type: 'some-type',
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })).to.equal(true)
    })

    it('does not permit update of secret', async () => {
      fakeNamespace.body.metadata.annotations['iam.amazonaws.com/permitted'] = '^$'
      poller = pollerFactory({
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        properties: ['fakePropertyName']
      })
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)

      let error
      try {
        await poller._upsertKubernetesSecret()
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('not allowed to fetch secret: fakeSecretName: namspace does not allow to assume role arn:aws:iam::123456789012:role/test-role')
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
      expect(loggerMock.info.calledWith(`starting poller on the secret ${poller._secretDescriptor.name}`)).to.equal(true)
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
      expect(loggerMock.info.calledWith(`stopping poller on the secret ${poller._secretDescriptor.name}`)).to.equal(true)
      expect(poller._interval).to.equal(null)
    })
  })
  describe('assume-role permissions', () => {
    let poller
    beforeEach(() => {
      poller = pollerFactory()
    })

    it('should restrict access to certain roles per namespace ', () => {
      const testcases = [
        {
          // no annotations at all
          ns: { metadata: {} },
          descriptor: {},
          permitted: true
        },
        {
          // empty annotation
          ns: { metadata: { annotations: { 'iam.amazonaws.com/permitted': '' } } },
          descriptor: {},
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { 'iam.amazonaws.com/permitted': '.*' } } },
          descriptor: { roleArn: 'whatever' },
          permitted: true
        },
        {
          // test regex: deny access
          ns: { metadata: { annotations: { 'iam.amazonaws.com/permitted': '^$' } } },
          descriptor: { roleArn: 'whatever' },
          permitted: false
        },
        {
          // real world example
          ns: { metadata: { annotations: { 'iam.amazonaws.com/permitted': 'arn:aws:iam::123456789012:role/.*' } } },
          descriptor: { roleArn: 'arn:aws:iam::123456789012:role/somerole' },
          permitted: true
        }
      ]

      for (let i = 0; i < testcases.length; i++) {
        const testcase = testcases[i]
        const verdict = poller._isPermitted(testcase.ns, testcase.descriptor)
        expect(verdict.allowed).to.equal(testcase.permitted)
      }
    })
  })
})
