'use strict'

/* eslint-disable no-process-env */

const localstack = process.env.LOCALSTACK || 0

const secretsManagerConfig = localstack ? { endpoint: 'http://localhost:4584', region: 'us-west-2' } : {}
const systemManagerConfig = localstack ? { endpoint: 'http://localhost:4583', region: 'us-west-2' } : {}

module.exports = {
  secretsManagerConfig,
  systemManagerConfig
}
