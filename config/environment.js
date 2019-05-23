'use strict'

/* eslint-disable no-process-env */

const environment = process.env.NODE_ENV
  ? process.env.NODE_ENV.toLowerCase() : 'development'

// Validate environment
const validEnvironments = new Set(['development', 'test', 'production'])
if (!validEnvironments.has(environment)) {
  throw new Error(`Invalid environment: ${environment}`)
}

// Load env file only when development env
if (environment === 'development') {
  require('dotenv').config()
}

const vaultEndpoint = process.env.VAULT_ENDPOINT || 'http://127.0.0.1:8200'
const pollerIntervalMilliseconds = process.env.POLLER_INTERVAL_MILLISECONDS
  ? Number(process.env.POLLER_INTERVAL_MILLISECONDS) : 10000

const logLevel = process.env.LOG_LEVEL || 'info'

const rolePermittedAnnotation = process.env.ROLE_PERMITTED_ANNOTATION || 'iam.amazonaws.com/permitted'

const metricsPort = process.env.METRICS_PORT || 3001

module.exports = {
  vaultEndpoint,
  environment,
  pollerIntervalMilliseconds,
  metricsPort,
  rolePermittedAnnotation,
  logLevel
}
