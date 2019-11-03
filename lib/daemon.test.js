/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const Daemon = require('./daemon')

describe('Daemon', () => {
  let daemon
  let loggerMock
  let pollerMock
  let pollerFactory

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()

    pollerMock = sinon.mock()
    pollerMock.start = sinon.stub().returns(pollerMock)
    pollerMock.stop = sinon.stub().returns(pollerMock)

    pollerFactory = sinon.mock()
    pollerFactory.createPoller = sinon.stub().returns(pollerMock)

    daemon = new Daemon({
      logger: loggerMock,
      pollerFactory
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('starts new pollers for external secrets', async () => {
    const fakeExternalSecretEvents = (async function * () {
      yield {
        type: 'ADDED',
        object: {
          metadata: {
            name: 'foo',
            namespace: 'foo',
            resourceVersion: '1'
          },
          secretDescriptor: {}
        }
      }
    }())
    daemon._externalSecretEvents = fakeExternalSecretEvents

    await daemon.start()
    daemon.stop()

    expect(pollerMock.start.called).to.equal(true)
    expect(pollerMock.stop.called).to.equal(true)
  })
})
