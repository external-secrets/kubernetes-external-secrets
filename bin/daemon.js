#!/usr/bin/env node

'use strict'

// make-promises-safe installs an process.on('unhandledRejection') handler
// that prints the stacktrace and exits the process
// with an exit code of 1, just like any uncaught exception.
require('make-promises-safe')

const Prometheus = require('prom-client')
const Daemon = require('../lib/daemon')
const MetricsServer = require('../lib/metrics-server')
const Metrics = require('../lib/metrics')
const { getExternalSecretEvents } = require('../lib/external-secret')
const PollerFactory = require('../lib/poller-factory')

const {
  backends,
  kubeClient,
  customResourceManager,
  customResourceManifest,
  logger,
  metricsPort,
  pollerIntervalMilliseconds
} = require('../config')

async function main () {
  logger.info('loading kube specs')
  await kubeClient.loadSpec()
  logger.info('successfully loaded kube specs')
  logger.info('updating CRD')
  await customResourceManager.upsertResource({ customResourceManifest })
  logger.info('successfully updated CRD')

  const externalSecretEvents = getExternalSecretEvents({
    kubeClient,
    customResourceManifest,
    logger
  })

  const registry = Prometheus.register
  const metrics = new Metrics({ registry })

  const pollerFactory = new PollerFactory({
    backends,
    kubeClient,
    metrics,
    pollerIntervalMilliseconds,
    customResourceManifest,
    logger
  })

  const daemon = new Daemon({
    externalSecretEvents,
    logger,
    pollerFactory
  })

  const metricsServer = new MetricsServer({
    port: metricsPort,
    registry,
    logger
  })

  logger.info('starting app')
  daemon.start()
  metricsServer.start()
  logger.info('successfully started app')
}

main()
