#!/usr/bin/env node

'use strict'

// make-promises-safe installs an process.on('unhandledRejection') handler
// that prints the stacktrace and exits the process
// with an exit code of 1, just like any uncaught exception.
require('make-promises-safe')

const Daemon = require('../lib/daemon')
const { getExternalSecretEvents } = require('../lib/external-secret')

const {
  backends,
  kubeClient,
  customResourceManager,
  customResourceManifest,
  logger,
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

  const daemon = new Daemon({
    backends,
    externalSecretEvents,
    kubeClient,
    logger,
    pollerIntervalMilliseconds
  })

  logger.info('starting app')
  daemon.start()
  logger.info('successfully started app')
}

main()
