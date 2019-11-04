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

const {
  backends,
  kubeClient,
  customResourceManager,
  customResourceManifest,
  logger,
  metricsPort,
  pollerIntervalMilliseconds
} = require('../config')

// Make sure uncaught exceptions are logged on exit
process.on('uncaughtException', err => {
  logger.error(err, 'Uncaught exception')
  process.exit(1)
})

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, 'Unhandled Rejection reason')
  logger.error(promise, 'Unhandled Rejection promise')
  process.exit(1)
})

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

  const daemon = new Daemon({
    backends,
    externalSecretEvents,
    kubeClient,
    logger,
    metrics,
    pollerIntervalMilliseconds
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
