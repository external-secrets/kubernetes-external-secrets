/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const { Readable } = require('stream')

const { getExternalSecretEvents } = require('./external-secret')

describe('getExternalSecretEvents', () => {
  let kubeClientMock
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
    mockedStream._read = () => {}

    externalSecretsApiMock.get = sinon.stub()
    kubeClientMock = sinon.mock()
    kubeClientMock.apis = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'] = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'].v1 = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io'].v1.watch = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io']
      .v1.watch.externalsecrets = sinon.mock()
    kubeClientMock.apis['kubernetes-client.io']
      .v1.watch.externalsecrets.getStream = () => mockedStream

    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    loggerMock.warn = sinon.stub()
    loggerMock.error = sinon.stub()
  })

  it('gets a stream of external secret events', async () => {
    const fakeExternalSecretObject = {
      apiVersion: 'kubernetes-client.io/v1',
      kind: 'ExternalSecret',
      metadata: {
        name: 'my-secret',
        namespace: 'default'
      },
      secretDescriptor: { backendType: 'secretsManager', data: [] }
    }

    const events = getExternalSecretEvents({
      kubeClient: kubeClientMock,
      customResourceManifest: fakeCustomResourceManifest,
      logger: loggerMock
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
