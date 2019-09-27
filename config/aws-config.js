'use strict'

/* eslint-disable no-process-env */
const AWS = require('aws-sdk')

const localstack = process.env.LOCALSTACK || 0

const secretsManagerConfig = localstack ? { endpoint: 'http://localhost:4584', region: 'us-west-2' } : {}
const systemManagerConfig = localstack ? { endpoint: 'http://localhost:4583', region: 'us-west-2' } : {}
const stsConfig = localstack ? { endpoint: 'http://localhost:4592', region: 'us-west-2' } : {}

module.exports = {
  secretsManagerFactory: (opts) => {
    if (localstack) {
      opts = secretsManagerConfig
    }
    return new AWS.SecretsManager(opts)
  },
  systemManagerFactory: (opts) => {
    if (localstack) {
      opts = systemManagerConfig
    }
    return new AWS.SSM(opts)
  },
  assumeRole: (assumeRoleOpts) => {
    const sts = new AWS.STS(stsConfig)
    return new Promise((resolve, reject) => {
      sts.assumeRole(assumeRoleOpts, (err, res) => {
        if (err) {
          return reject(err)
        }
        resolve(res)
      })
    })
  }
}
