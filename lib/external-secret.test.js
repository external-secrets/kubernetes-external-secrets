/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const { Readable } = require('stream')

const { getExternalSecretEvents } = require('./external-secret')

describe('getExternalSecretEvents', () => {
  let kubeClientMock
  let watchedNamespaces
  let externalSecretsApiMock
  let fakeCustomResourceManifest
  let loggerMock
  let mockedStream

  beforeEach(() => {
    fakeCustomResourceManifest = {
      spec: {
        group: 'kubernetes-client.io',
        names: {
          plural: 'externalsecrets'
        }
      }
    }
    externalSecretsApiMock = sinon.mock()

    mockedStream = new Readable()
    mockedStream._read = () => { }

    externalSecretsApiMock.get = sinon.stub()

    kubeClientMock = {
      apis: {
        'kubernetes-client.io': {
          v1: {
            watch: {
              namespaces: () => {
                return {
                  externalsecrets: {
                    getStream: () => mockedStream
                  }
                }
              }
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

    const events = getExternalSecretEvents({
      kubeClient: kubeClientMock,
      watchedNamespaces: watchedNamespaces,
      customResourceManifest: fakeCustomResourceManifest,
      logger: loggerMock,
      watchTimeout: 5000
    })

    mockedStream.push(`${JSON.stringify({
      type: 'MODIFIED',
      object: fakeExternalSecretObject
    })}\n`)

    mockedStream.push(`${JSON.stringify({
      type: 'ADDED',
      object: fakeExternalSecretObject
    })}\n`)

    mockedStream.push(`${JSON.stringify({
      type: 'DELETED',
      object: fakeExternalSecretObject
    })}\n`)

    mockedStream.push(`${JSON.stringify({
      type: 'DELETED_ALL'
    })}\n`)

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
