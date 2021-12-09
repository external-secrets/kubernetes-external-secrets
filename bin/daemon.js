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
  customResourceManifest,
  logger,
  metricsPort,
  pollerIntervalMilliseconds,
  pollingDisabled,
  rolePermittedAnnotation,
  namingPermittedAnnotation,
  enforceNamespaceAnnotation,
  watchTimeout,
  watchedNamespaces,
  instanceId
} = require('../config')

async function main () {
  logger.info('loading kube specs')
  await kubeClient.loadSpec()
  logger.info('successfully loaded kube specs')

  kubeClient.addCustomResourceDefinition(customResourceManifest)

  try {
    logger.info('verifiying CRD is installed')
    await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1[customResourceManifest.spec.names.plural].get()
  } catch (err) {
    logger.error('CRD installation check failed, statusCode: %s', err.statusCode)
    process.exit(1)
  }

  const externalSecretEvents = getExternalSecretEvents({
    kubeClient,
    watchedNamespaces,
    customResourceManifest,
    logger,
    watchTimeout
  })

  const registry = Prometheus.register
  Prometheus.collectDefaultMetrics({ register: registry })
  const metrics = new Metrics({ registry })

  const pollerFactory = new PollerFactory({
    backends,
    kubeClient,
    metrics,
    pollerIntervalMilliseconds,
    rolePermittedAnnotation,
    namingPermittedAnnotation,
    enforceNamespaceAnnotation,
    customResourceManifest,
    pollingDisabled,
    logger
  })

  const daemon = new Daemon({
    externalSecretEvents,
    logger,
    pollerFactory,
    instanceId
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
