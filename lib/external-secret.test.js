/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const { Readable } = require('stream')

const { getExternalSecretEvents } = require('./external-secret')

describe('getExternalSecretEvents', () => {
  let kubeClientMock
  let watchedNamespaces
  let fakeCustomResourceManifest
  let loggerMock
  let externalsecrets

  beforeEach(() => {
    fakeCustomResourceManifest = {
      spec: {
        group: 'kubernetes-client.io',
        names: {
          plural: 'externalsecrets'
        }
      }
    }

    externalsecrets = {
      getObjectStream: () => undefined
    }

    kubeClientMock = {
      apis: {
        'kubernetes-client.io': {
          v1: {
            watch: {
              namespaces: () => {
                return {
                  externalsecrets
                }
              },
              externalsecrets
            }
          }
        }
      }
    }

    watchedNamespaces = []

    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    loggerMock.warn = sinon.stub()
    loggerMock.error = sinon.stub()
    loggerMock.debug = sinon.stub()
  })

  it('gets a stream of external secret events', async () => {
    const fakeExternalSecretObject = {
      apiVersion: 'kubernetes-client.io/v1',
      kind: 'ExternalSecret',
      metadata: {
        name: 'my-secret',
        namespace: 'default'
      },
      spec: { backendType: 'secretsManager', data: [] }
    }

    const fakeStream = Readable.from([
      {
        type: 'MODIFIED',
        object: fakeExternalSecretObject
      },
      {
        type: 'ADDED',
        object: fakeExternalSecretObject
      },
      {
        type: 'DELETED',
        object: fakeExternalSecretObject
      },
      {
        type: 'DELETED_ALL'
      }
    ])

    fakeStream.end = sinon.stub()
    externalsecrets.getObjectStream = () => fakeStream

    const events = getExternalSecretEvents({
      kubeClient: kubeClientMock,
      watchedNamespaces: watchedNamespaces,
      customResourceManifest: fakeCustomResourceManifest,
      logger: loggerMock,
      watchTimeout: 5000
    })

    const modifiedEvent = await events.next()
    expect(modifiedEvent.value.type).is.equal('MODIFIED')
    expect(modifiedEvent.value.object).is.deep.equal(fakeExternalSecretObject)

    const addedEvent = await events.next()
    expect(addedEvent.value.type).is.equal('ADDED')
    expect(addedEvent.value.object).is.deep.equal(fakeExternalSecretObject)

    const deletedEvent = await events.next()
    expect(deletedEvent.value.type).is.equal('DELETED')
    expect(deletedEvent.value.object).is.deep.equal(fakeExternalSecretObject)

    const deletedAllEvent = await events.next()
    expect(deletedAllEvent.value.type).is.equal('DELETED_ALL')
    expect(deletedAllEvent.value.object).is.deep.equal(undefined)
  })
})
