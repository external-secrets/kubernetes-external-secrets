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
// Grab the vault namespace from the environment
const vaultNamespace = process.env.VAULT_NAMESPACE || null
const vaultTokenRenewThreshold = process.env.VAULT_TOKEN_RENEW_THRESHOLD || null
const defaultVaultMountPoint = process.env.DEFAULT_VAULT_MOUNT_POINT || null
const defaultVaultRole = process.env.DEFAULT_VAULT_ROLE || null

const pollerIntervalMilliseconds = process.env.POLLER_INTERVAL_MILLISECONDS
  ? Number(process.env.POLLER_INTERVAL_MILLISECONDS) : 10000

const logLevel = process.env.LOG_LEVEL || 'info'
const useHumanReadableLogLevels = 'USE_HUMAN_READABLE_LOG_LEVELS' in process.env
const logMessageKey = process.env.LOG_MESSAGE_KEY || 'msg'

const pollingDisabled = 'DISABLE_POLLING' in process.env

const rolePermittedAnnotation = process.env.ROLE_PERMITTED_ANNOTATION || 'iam.amazonaws.com/permitted'
const namingPermittedAnnotation = process.env.NAMING_PERMITTED_ANNOTATION || 'externalsecrets.kubernetes-client.io/permitted-key-name'
const enforceNamespaceAnnotation = 'ENFORCE_NAMESPACE_ANNOTATIONS' in process.env || false

const metricsPort = process.env.METRICS_PORT || 3001

const watchTimeout = process.env.WATCH_TIMEOUT ? parseInt(process.env.WATCH_TIMEOUT) : 60000

// A comma-separated list of watched namespaces. If set, only ExternalSecrets in those namespaces will be handled.
let watchedNamespaces = process.env.WATCHED_NAMESPACES || ''

// Return an array after splitting the watched namespaces string and clean up user input.
watchedNamespaces = watchedNamespaces
  .split(',')
  // Remove any extra spaces.
  .map(namespace => { return namespace.trim() })
  // Remove empty values (in case there is a tailing comma).
  .filter(namespace => namespace)

module.exports = {
  vaultEndpoint,
  vaultNamespace,
  vaultTokenRenewThreshold,
  defaultVaultMountPoint,
  defaultVaultRole,
  environment,
  pollerIntervalMilliseconds,
  metricsPort,
  rolePermittedAnnotation,
  namingPermittedAnnotation,
  enforceNamespaceAnnotation,
  pollingDisabled,
  logLevel,
  useHumanReadableLogLevels,
  logMessageKey,
  watchTimeout,
  watchedNamespaces
}
