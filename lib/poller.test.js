/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Poller = require('./poller')

describe('Poller', () => {
  let backendMock
  let kubeClientMock
  let loggerMock
  let metricsMock
  let pollerFactory
  let fakeCustomResourceManifest
  let kubeNamespaceMock
  let externalSecretsApiMock
  let fakeExternalSecret

  const getOwnerReference = () => ({
    apiVersion: fakeExternalSecret.apiVersion,
    controller: true,
    kind: fakeExternalSecret.kind,
    name: fakeExternalSecret.metadata.name,
    uid: fakeExternalSecret.metadata.uid
  })

  const rolePermittedAnnotation = 'iam.amazonaws.com/permitted'
  const namingPermittedAnnotation = 'externalsecrets.kubernetes-client.io/permitted-key-name'

  beforeEach(() => {
    backendMock = sinon.mock()
    kubeClientMock = sinon.mock()
    loggerMock = sinon.mock()
    metricsMock = sinon.mock()

    loggerMock.info = sinon.stub()
    loggerMock.debug = sinon.stub()
    loggerMock.error = sinon.stub()

    metricsMock.observeSync = sinon.stub()

    externalSecretsApiMock = sinon.mock()
    externalSecretsApiMock.status = sinon.stub()
    externalSecretsApiMock.status.put = sinon.mock()
    externalSecretsApiMock.status.get = sinon.mock()

    kubeNamespaceMock = sinon.mock()
    kubeNamespaceMock.secrets = sinon.stub().returns(kubeNamespaceMock)
    kubeNamespaceMock.externalsecrets = sinon.stub().returns(externalSecretsApiMock)
    kubeClientMock.api = sinon.mock()
    kubeClientMock.api.v1 = sinon.mock()
    kubeClientMock.api.v1.namespaces = sinon.stub().returns(kubeNamespaceMock)
    kubeClientMock.apis = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'] = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'].v1 = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'].v1.namespaces = sinon.stub().returns(kubeNamespaceMock)

    fakeCustomResourceManifest = {
      spec: {
        group: 'kubernetes-client.io',
        names: {
          plural: 'externalsecrets'
        }
      }
    }

    fakeExternalSecret = {
      apiVersion: 'kubernetes-client.io/v1',
      kind: 'ExternalSecret',
      metadata: {
        namespace: 'fakeNamespace',
        name: 'fakeSecretName',
        uid: '4c10d879-2646-40dc-8595-d0b06b60a9ed',
        generation: 1
      }
    }

    pollerFactory = (spec = {
      backendType: 'fakeBackendType',
      properties: [
        'fakePropertyName1',
        'fakePropertyName2'
      ]
    }) => {
      fakeExternalSecret.spec = spec
      return new Poller({
        backends: {
          fakeBackendType: backendMock
        },
        metrics: metricsMock,
        intervalMilliseconds: 5000,
        kubeClient: kubeClientMock,
        logger: loggerMock,
        externalSecret: fakeExternalSecret,
        rolePermittedAnnotation,
        namingPermittedAnnotation,
        customResourceManifest: fakeCustomResourceManifest
      })
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('backwards compat with secretDescriptor', () => {
    const mySpec = {
      dataFrom: ['some-key', 'some-other'],
      backendType: 'my-magical-backend'
    }

    fakeExternalSecret.secretDescriptor = mySpec

    const myPoller = new Poller({
      backends: {
        fakeBackendType: backendMock
      },
      metrics: metricsMock,
      intervalMilliseconds: 5000,
      kubeClient: kubeClientMock,
      logger: loggerMock,
      externalSecret: fakeExternalSecret,
      rolePermittedAnnotation,
      customResourceManifest: fakeCustomResourceManifest
    })

    expect(myPoller._spec).to.deep.equal(mySpec)
  })

  describe('_createSecretManifest', () => {
    let clock

    beforeEach(() => {
      clock = sinon.useFakeTimers({
        now: Date.now()
      })
      backendMock.getSecretManifestData = sinon.stub()
    })

    afterEach(() => {
      clock.restore()
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
        spec: {
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
          ownerReferences: [getOwnerReference()]
        },
        type: 'Opaque',
        data: {
          fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
          fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
        }
      })
    })

    it('creates secret manifest - with type (backwards compat)', async () => {
      const poller = pollerFactory({
        type: 'dummy-test-type',
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        data: [
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
        spec: {
          type: 'dummy-test-type',
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          data: [
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
          ownerReferences: [getOwnerReference()]
        },
        type: 'dummy-test-type',
        data: {
          fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
          fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
        }
      })
    })

    it('creates secret manifest - with template type (should work with backwards compat type)', async () => {
      const poller = pollerFactory({
        template: {
          type: 'dummy-test-type'
        },
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        data: []
      })

      backendMock.getSecretManifestData.resolves({})

      const secretManifest = await poller._createSecretManifest()

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName',
          ownerReferences: [getOwnerReference()]
        },
        type: 'dummy-test-type',
        data: {}
      })
    })

    it('creates secret manifest - with template', async () => {
      const poller = pollerFactory({
        type: 'dummy-test-type',
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        properties: [
          'fakePropertyName1',
          'fakePropertyName2'
        ],
        template: {
          metadata: {
            annotations: {
              cat: 'cheese'
            },
            labels: {
              dog: 'farfel'
            },
            name: 'fakerSecretName'
          }
        }
      })

      backendMock.getSecretManifestData.resolves({
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
      })

      const secretManifest = await poller._createSecretManifest()

      expect(backendMock.getSecretManifestData.calledWith({
        spec: {
          type: 'dummy-test-type',
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          properties: [
            'fakePropertyName1',
            'fakePropertyName2'
          ],
          template: {
            metadata: {
              annotations: {
                cat: 'cheese'
              },
              labels: {
                dog: 'farfel'
              },
              name: 'fakerSecretName'
            }
          }
        }
      })).to.equal(true)

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName',
          ownerReferences: [getOwnerReference()],
          annotations: {
            cat: 'cheese'
          },
          labels: {
            dog: 'farfel'
          }
        },
        type: 'dummy-test-type',
        data: {
          fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
          fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy' // base 64 value
        }
      })
    })

    it('creates secret manifest - with lodash template', async () => {
      const poller = pollerFactory({
        type: 'dummy-test-type',
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        template: {
          metadata: {
            labels: {
              world: '<% let content = JSON.parse(data.s1) %><%= content.f2.f22 %>'
            }
          },
          stringData: {
            'test.yaml': `
              <%= yaml.dump(JSON.parse(data.s1)) %>
              <% let s2 = JSON.parse(data.s2) %><% s2.arr.forEach((e, i) => { %>arr_<%= i %>: <%= e %>
              <% }) %>
            `
          }
        },
        data: [
          { key: 'kv/data/test/secret1', name: 's1' },
          { key: 'kv/data/test/secret2', name: 's2' }
        ]
      })

      backendMock.getSecretManifestData.resolves({
        s1: 'eyJmMSI6MTEsImYyIjp7ImYyMiI6ImhlbGxvIn19Cg==', // base 64 value
        s2: 'eyJhcnIiOlsxLDIsM119' // base 64 value
      })

      const secretManifest = await poller._createSecretManifest()

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          ownerReferences: [getOwnerReference()],
          labels: {
            world: 'hello'
          },
          name: 'fakeSecretName'
        },
        type: 'dummy-test-type',
        data: {
          s1: 'eyJmMSI6MTEsImYyIjp7ImYyMiI6ImhlbGxvIn19Cg==', // base 64 value
          s2: 'eyJhcnIiOlsxLDIsM119' // base 64 value
        },
        stringData: {
          'test.yaml': '\n              f1: 11\nf2:\n  f22: hello\n\n              arr_0: 1\n              arr_1: 2\n              arr_2: 3\n              \n            '
        }
      })
    })

    it('creates secret manifest - with lodash template (without stringData)', async () => {
      const poller = pollerFactory({
        type: 'dummy-test-type',
        backendType: 'fakeBackendType',
        name: 'fakeSecretName',
        template: {
          metadata: {
            labels: {
              world: '<% let content = JSON.parse(data.s1) %><%= content.f2.f22 %>'
            }
          }
        },
        data: [
          { key: 'kv/data/test/secret1', name: 's1' }
        ]
      })

      backendMock.getSecretManifestData.resolves({
        s1: 'eyJmMSI6MTEsImYyIjp7ImYyMiI6ImhlbGxvIn19Cg==' // base 64 value
      })

      const secretManifest = await poller._createSecretManifest()

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          ownerReferences: [getOwnerReference()],
          labels: {
            world: 'hello'
          },
          name: 'fakeSecretName'
        },
        type: 'dummy-test-type',
        data: {
          s1: 'eyJmMSI6MTEsImYyIjp7ImYyMiI6ImhlbGxvIn19Cg==' // base 64 value
        }
      })
    })
  })

  describe('_poll', () => {
    let poller
    beforeEach(() => {
      poller = pollerFactory({
        backendType: 'fakeBackendType',
        properties: ['fakePropertyName1', 'fakePropertyName2']
      })
      poller._upsertKubernetesSecret = sinon.stub()
      poller._setNextPoll = sinon.stub()
      poller._updateStatus = sinon.stub()
    })

    it('polls secrets', async () => {
      poller._upsertKubernetesSecret.resolves()

      await poller._poll()
      expect(loggerMock.info.calledWith(`running poll on the secret ${poller._namespace}/${poller._name}`)).to.equal(true)

      expect(metricsMock.observeSync.getCall(0).args[0]).to.deep.equal({
        name: 'fakeSecretName',
        namespace: 'fakeNamespace',
        backend: 'fakeBackendType',
        status: 'success'
      })
      expect(poller._updateStatus.calledWith('SUCCESS')).to.equal(true)
      expect(poller._upsertKubernetesSecret.calledWith()).to.equal(true)
    })

    it('logs error if storing secret operation fails', async () => {
      const error = new Error('fake error message')
      poller._upsertKubernetesSecret.throws(error)

      await poller._poll()

      expect(metricsMock.observeSync.getCall(0).args[0]).to.deep.equal({
        name: 'fakeSecretName',
        namespace: 'fakeNamespace',
        backend: 'fakeBackendType',
        status: 'error'
      })
      expect(poller._updateStatus.calledWith(`ERROR, ${error.message}`)).to.equal(true)
      expect(loggerMock.error.calledWith(error, `failure while polling the secret ${poller._namespace}/${poller._name}`)).to.equal(true)
    })
  })

  describe('_updateStatus', () => {
    it('handles 409 - Conflict', async () => {
      const conflictError = new Error('Conflict')
      conflictError.statusCode = 409
      externalSecretsApiMock.status.put.throws(conflictError)

      const poller = pollerFactory()

      await poller._updateStatus('SUCCESS')

      expect(loggerMock.info.calledWith(`status update failed for externalsecret ${poller._namespace}/${poller._name}, due to modification, new poller should start`)).to.equal(true)
    })

    it('rethrows other errors', async () => {
      const notFoundError = new Error('Not Found')
      notFoundError.statusCode = 404
      externalSecretsApiMock.status.put.throws(notFoundError)

      const poller = pollerFactory()
      let error

      try {
        await poller._updateStatus('SUCCESS')
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('Not Found')
    })

    it('handles odd whitespace and newlines in status', async () => {
      const poller = pollerFactory()

      await poller._updateStatus('\n\n\nLots      of spaces\n\n\n').then(() => {
        const statusMessage = externalSecretsApiMock.status.put.getCall(0).args[0].body.status.status
        expect(statusMessage).to.equal('Lots of spaces')
      })
    })
  })

  describe('_scheduleNextPoll', () => {
    let poller
    let clock
    let fakeStatus
    let fakeDate

    beforeEach(() => {
      clock = sinon.useFakeTimers({
        now: Date.now()
      })

      poller = pollerFactory({
        backendType: 'fakeBackendType',
        properties: ['fakePropertyName']
      })

      poller._setNextPoll = sinon.stub()
      poller._poll = sinon.stub()

      fakeDate = new Date()

      fakeStatus = {
        body: {
          status: {
            lastSync: fakeDate.toISOString(),
            observedGeneration: fakeExternalSecret.metadata.generation
          }
        }
      }

      externalSecretsApiMock.status.get = sinon.stub().resolves(fakeStatus)
    })

    afterEach(() => {
      clock.restore()
    })

    describe('last sync', () => {
      it('no last sync', async () => {
        delete fakeStatus.body.status.lastSync

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(0)).to.equal(true)
      })

      it('with new last sync - queues poll', async () => {
        const elapsedTime = 2000
        clock.tick(elapsedTime)

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(poller._intervalMilliseconds - elapsedTime)).to.equal(true)
      })

      it('with last sync in the future - triggers poll', async () => {
        fakeDate.setFullYear(fakeDate.getFullYear() + 1)
        fakeStatus.body.status.lastSync = fakeDate.toISOString()

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(0)).to.equal(true)
      })

      it('with old last sync - triggers poll', async () => {
        clock.tick(poller._intervalMilliseconds * 2) // greater than poller._intervalMilliseconds

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(0)).to.equal(true)
      })
    })

    describe('generation', () => {
      it('no observed generation', async () => {
        delete fakeStatus.body.status.observedGeneration

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(0)).to.equal(true)
      })

      it('with newer observed generation - queues poll', async () => {
        fakeExternalSecret.metadata.generation = 10
        fakeStatus.body.status.observedGeneration = 100

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(fakeDate.getTime() - (Date.now() - poller._intervalMilliseconds))).to.equal(true)
      })

      it('with older observed generation - triggers poll', async () => {
        fakeExternalSecret.metadata.generation = 10
        fakeStatus.body.status.observedGeneration = 1

        await poller._scheduleNextPoll()

        expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
        expect(poller._setNextPoll.calledWith(0)).to.equal(true)
      })
    })

    it('disable interval polling', async () => {
      poller = new Poller({
        intervalMilliseconds: 5000,
        kubeClient: kubeClientMock,
        logger: loggerMock,
        externalSecret: fakeExternalSecret,
        customResourceManifest: fakeCustomResourceManifest,
        // Disable polling!
        pollingDisabled: true
      })

      poller._setNextPoll = sinon.stub()

      await poller._scheduleNextPoll()

      expect(externalSecretsApiMock.status.get.calledWith()).to.equal(true)
      sinon.assert.notCalled(poller._setNextPoll)
    })

    it('logs error if it fails', async () => {
      const error = new Error('something boom')
      externalSecretsApiMock.status.get = sinon.stub().throws(error)

      await poller._scheduleNextPoll()
      expect(loggerMock.error.calledWith(error, 'status check went boom for fakeNamespace/fakeSecretName')).to.equal(true)
    })
  })

  describe('_upsertKubernetesSecret', () => {
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
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)
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
      const notFoundError = new Error('Not Found')
      notFoundError.statusCode = 404
      const kubeSecret = sinon.mock()
      kubeSecret.get = sinon.stub().throws(notFoundError)
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeSecret)
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

    it("doesn't update a secret if it hasn't changed", async () => {
      const kubeSecret = sinon.mock()
      kubeSecret.put = sinon.stub()
      kubeSecret.get = sinon.stub().returns({
        body: {
          metadata: {
            name: 'fakeSecretName'
          },
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeSecret)
      kubeNamespaceMock.secrets.post = sinon.stub()

      const result = await poller._upsertKubernetesSecret()
      expect(result).to.equal(true)
      expect(kubeSecret.put.called).to.equal(false)
      expect(kubeNamespaceMock.secrets.post.called).to.equal(false)
    })

    it('updates secret', async () => {
      const kubeSecret = sinon.mock()
      kubeSecret.get = sinon.stub().returns({
        body: {
          metadata: {
            name: 'fakeSecretName'
          },
          data: {
            fakePropertyName: 'differentValue'
          }
        }
      })
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeSecret)
      kubeSecret.put = sinon.stub().resolves()
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)

      await poller._upsertKubernetesSecret()

      expect(kubeNamespaceMock.secrets.calledWith('fakeSecretName')).to.equal(true)

      expect(kubeSecret.put.calledWith({
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

    it('updates secret if the custom metadata has changed', async () => {
      const kubeSecret = sinon.mock()
      kubeSecret.get = sinon.stub().returns({
        body: {
          metadata: {
            creationTimestamp: new Date().toDateString(),
            name: 'fakeSecretName',
            labels: {
              myFakeLabel: 'test'
            }
          },
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeSecret)
      kubeSecret.put = sinon.stub().resolves()
      kubeNamespaceMock.get = sinon.stub().resolves(fakeNamespace)

      await poller._upsertKubernetesSecret()

      expect(kubeNamespaceMock.secrets.calledWith('fakeSecretName')).to.equal(true)

      expect(kubeSecret.put.calledWith({
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
      fakeNamespace.body.metadata.annotations[rolePermittedAnnotation] = '^$'
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
      expect(error.message).equals('not allowed to fetch secret: fakeNamespace/fakeSecretName: namespace does not allow to assume role arn:aws:iam::123456789012:role/test-role')
    })

    it('fails storing secret', async () => {
      const internalErrorServer = new Error('Internal Error Server')
      internalErrorServer.statusCode = 500
      const kubeSecret = sinon.mock()
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeSecret)
      kubeSecret.get = sinon.stub().throws({ statusCode: 404 })
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
    let poller

    beforeEach(() => {
      poller = pollerFactory()
      poller._scheduleNextPoll = sinon.stub()
    })

    afterEach(() => {
      poller.stop()
    })

    it('starts poller', async () => {
      expect(poller._timeoutId).to.equal(null)

      poller.start()

      expect(loggerMock.info.calledWith(`starting poller for ${poller._namespace}/${poller._name}`)).to.equal(true)
      expect(poller._scheduleNextPoll.called).to.equal(true)
    })
  })

  describe('stop', () => {
    let poller

    beforeEach(() => {
      poller = pollerFactory()
      poller._poll = sinon.stub()
    })

    it('stops poller', async () => {
      poller._timeoutId = 'some id'

      expect(poller._timeoutId).to.not.equal(null)

      poller.stop()

      expect(loggerMock.info.calledWith(`stopping poller for ${poller._namespace}/${poller._name}`)).to.equal(true)
      expect(poller._timeoutId).to.equal(null)
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
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: '' } } },
          descriptor: {},
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: '.*' } } },
          descriptor: { roleArn: 'whatever' },
          permitted: true
        },
        {
          // test regex: deny access
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: '^$' } } },
          descriptor: { roleArn: 'whatever' },
          permitted: false
        },
        {
          // real world example
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: 'arn:aws:iam::123456789012:role/.*' } } },
          descriptor: { roleArn: 'arn:aws:iam::123456789012:role/somerole' },
          permitted: true
        },
        {
          // test undefined
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: 'my-kiam-role.*' } } },
          descriptor: {},
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
  describe('naming conventions', () => {
    let poller
    beforeEach(() => {
      poller = pollerFactory()
    })
    it('should restrict access as defined in namespace naming convention ', () => {
      const testcases = [
        {
          // no annotations at all
          ns: { metadata: {} },
          descriptor: {},
          permitted: true
        },
        {
          // empty annotation
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '' } } },
          descriptor: {},
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ]
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-a/secret', name: 'somethingelse' }
            ]
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-b/secret', name: 'somethingelse' }
            ]
          },
          permitted: false
        },
        {
          // test regex on path
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { path: 'dev/team-a/secret' }
            ]
          },
          permitted: true
        },
        {
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-a/secret', name: 'somethingelse', path: '' }
            ]
          },
          permitted: false
        },
        {
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'this-should-fail', name: 'somethingelse', path: 'dev/team-a/such-path' }
            ]
          },
          permitted: false
        },
        {
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-a/such-key', name: 'somethingelse', path: 'this-should-fail' }
            ]
          },
          permitted: false
        },
        {
          // test regex on path
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { path: 'dev/team-b/secret' }
            ]
          },
          permitted: false
        },
        {
          // test regex on path when key is also specified
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { path: 'dev/team-b/secret', key: 'dev/team-a/secret' }
            ]
          },
          permitted: false
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            dataFrom: [
              'dev/team-b/secret'
            ]
          },
          permitted: false
        },
        {
          // empty annotation
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '' } } },
          descriptor: {
            dataFrom: ['test']
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            dataFrom: [
              'dev/team-a/secret'
            ]
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ],
            dataFrom: ['something']
          },
          permitted: true
        },
        {
          // test regex data bad, dataFrom OK
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-b/secret', name: 'somethingelse' }
            ],
            dataFrom: [
              'dev/team-a/ok-secret'
            ]
          },
          permitted: false
        },
        {
          // test regex data OK, dataFrom bad
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'dev/team-a/.*' } } },
          descriptor: {
            data: [
              { key: 'dev/team-a/ok-secret', name: 'somethingelse' }
            ],
            dataFrom: [
              'dev/team-b/bad-secret'
            ]
          },
          permitted: false
        },
        {
          // test multiple regex data
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: ['dev/team-a/.*', 'common/.*'] } } },
          descriptor: {
            data: [
              { key: 'dev/team-a/ok-secret', name: 'somethingelse' },
              { key: 'common/generic-secret', name: 'genericsecret' }
            ]
          },
          permitted: true
        },
        {
          // test multiple regex data
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: ['dev/team-a/.*', 'common/.*'] } } },
          descriptor: {
            data: [
              { key: 'dev/team-b/nok-secret', name: 'somethingelse' },
              { key: 'common/generic-secret', name: 'genericsecret' }
            ]
          },
          permitted: false
        },
        {
          // test multiple regex data
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: ['dev/team-b/.*', 'common/.*'] } } },
          descriptor: {
            data: [
              { key: 'common/generic-secret', name: 'genericsecret' }
            ],
            dataFrom: [
              'common/generic-secret'
            ]
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*', [rolePermittedAnnotation]: 'a' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ],
            roleArn: 'b'
          },
          permitted: false
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*', [rolePermittedAnnotation]: 'a' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ],
            vaultRole: 'b'
          },
          permitted: false
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*', [rolePermittedAnnotation]: 'a' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ],
            roleArn: 'a'
          },
          permitted: true
        },
        {
          // test regex
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '.*', [rolePermittedAnnotation]: 'a' } } },
          descriptor: {
            data: [
              { key: 'whatever', name: 'somethingelse' }
            ],
            vaultRole: 'a'
          },
          permitted: true
        }
      ]

      for (let i = 0; i < testcases.length; i++) {
        const testcase = testcases[i]
        const verdict = poller._isPermitted(testcase.ns, testcase.descriptor)
        expect(verdict.allowed, `test case ${i + 1}`).to.equal(testcase.permitted)
      }
    })
  })
  describe('namespace annotation enforcement', () => {
    let poller
    beforeEach(() => {
      poller = new Poller({
        backends: {
          fakeBackendType: backendMock
        },
        metrics: metricsMock,
        intervalMilliseconds: 5000,
        kubeClient: kubeClientMock,
        logger: loggerMock,
        externalSecret: fakeExternalSecret,
        rolePermittedAnnotation,
        namingPermittedAnnotation,
        enforceNamespaceAnnotation: true,
        customResourceManifest: fakeCustomResourceManifest
      })
    })

    it('should enforce namespace annotations`', () => {
      const testcases = [
        {
          // no annotations at all
          ns: { metadata: {} },
          descriptor: {},
          permitted: false
        },
        {
          // empty name annotation
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: '' } } },
          descriptor: {
            dataFrom: ['test']
          },
          permitted: false
        },
        {
          // empty role annotation
          ns: { metadata: { annotations: { [rolePermittedAnnotation]: '' } } },
          descriptor: {
            dataFrom: ['test']
          },
          permitted: false
        },
        {
          // missing role annotation
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'a' } } },
          descriptor: {
            dataFrom: ['a'],
            roleArn: 'a'
          },
          permitted: false
        },
        {
          // empty role annotation
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'a', [rolePermittedAnnotation]: '' } } },
          descriptor: {
            dataFrom: ['a'],
            roleArn: 'a'
          },
          permitted: false
        },
        {
          // all required annotations
          ns: { metadata: { annotations: { [namingPermittedAnnotation]: 'a', [rolePermittedAnnotation]: 'b' } } },
          descriptor: {
            dataFrom: ['a']
          },
          permitted: true
        }
      ]

      for (let i = 0; i < testcases.length; i++) {
        const testcase = testcases[i]
        const verdict = poller._isPermitted(testcase.ns, testcase.descriptor)
        expect(verdict.allowed, `test case ${i + 1}`).to.equal(testcase.permitted)
      }
    })
  })
})
