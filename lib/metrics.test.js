/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const Prometheus = require('prom-client')

const Metrics = require('./metrics')

describe('Metrics', () => {
  let registry
  let metrics

  beforeEach(async () => {
    registry = new Prometheus.Registry()
    metrics = new Metrics({ registry })
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('should store metrics', async () => {
    metrics.observeSync({
      name: 'foo',
      namespace: 'example',
      backend: 'foo',
      status: 'success'
    })
    expect(registry.metrics()).to.have.string('sync_calls{name="foo",namespace="example",backend="foo",status="success"} 1')
  })
})
