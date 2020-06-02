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

const vaultEndpoint = process.env.VAULT_ADDR || 'http://127.0.0.1:8200'
const pollerIntervalMilliseconds = process.env.POLLER_INTERVAL_MILLISECONDS
  ? Number(process.env.POLLER_INTERVAL_MILLISECONDS) : 10000

const logLevel = process.env.LOG_LEVEL || 'info'
const pollingDisabled = 'DISABLE_POLLING' in process.env

const rolePermittedAnnotation = process.env.ROLE_PERMITTED_ANNOTATION || 'iam.amazonaws.com/permitted'
const namingPermittedAnnotation = process.env.NAMING_PERMITTED_ANNOTATION || 'externalsecrets.kubernetes-client.io/permitted-key-name'

const metricsPort = process.env.METRICS_PORT || 3001

const customResourceManagerDisabled = 'DISABLE_CUSTOM_RESOURCE_MANAGER' in process.env

module.exports = {
  vaultEndpoint,
  environment,
  pollerIntervalMilliseconds,
  metricsPort,
  rolePermittedAnnotation,
  namingPermittedAnnotation,
  pollingDisabled,
  logLevel,
  customResourceManagerDisabled
}
