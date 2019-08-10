/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const Prometheus = require('prom-client')
const request = require('supertest')

const MetricsServer = require('./metrics-server')
const Metrics = require('./metrics')

describe('MetricsServer', () => {
  let server
  let loggerMock
  let registry
  let metrics

  beforeEach(async () => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    registry = new Prometheus.Registry()
    metrics = new Metrics({ registry })

    server = new MetricsServer({
      logger: loggerMock,
      registry: registry,
      port: 3918
    })

    await server.start()
  })

  afterEach(async () => {
    sinon.restore()
    await server.stop()
  })

  it('start server to serve metrics', async () => {
    metrics.observeSync({
      name: 'foo',
      namespace: 'example',
      backend: 'foo',
      status: 'success'
    })

    metrics.observeSync({
      name: 'bar',
      namespace: 'example',
      backend: 'foo',
      status: 'failed'
    })

    const res = await request('http://localhost:3918')
      .get('/metrics')
      .expect('Content-Type', Prometheus.register.contentType)
      .expect(200)

    expect(res.text).to.have.string('sync_calls{name="foo",namespace="example",backend="foo",status="success"} 1')
    expect(res.text).to.have.string('sync_calls{name="bar",namespace="example",backend="foo",status="failed"} 1')
  })
})
