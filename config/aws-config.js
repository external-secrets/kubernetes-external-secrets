'use strict'

/* eslint-disable no-process-env */
const AWS = require('aws-sdk')
const clonedeep = require('lodash.clonedeep')
const merge = require('lodash.merge')
const fs = require('fs').promises;

const localstack = process.env.LOCALSTACK || 0
const fargate = process.env.FARGATE || 0

let secretsManagerConfig = {}
let systemManagerConfig = {}
let stsConfig = {
  region: process.env.AWS_REGION || 'us-west-2',
  stsRegionalEndpoints: process.env.AWS_STS_ENDPOINT_TYPE || 'regional'
}

if (localstack) {
  secretsManagerConfig = {
    endpoint: process.env.LOCALSTACK_SM_URL || 'http://localhost:4584',
    region: process.env.AWS_REGION || 'us-west-2'
  }
  systemManagerConfig = {
    endpoint: process.env.LOCALSTACK_SSM_URL || 'http://localhost:4583',
    region: process.env.AWS_REGION || 'us-west-2'
  }
  stsConfig = {
    endpoint: process.env.LOCALSTACK_STS_URL || 'http://localhost:4592',
    region: process.env.AWS_REGION || 'us-west-2'
  }
}

async function loadServiceToken() {
  const tokendata = await fs.readFile("/var/run/secrets/eks.amazonaws.com/serviceaccount/token", "utf8");
  return new Buffer(data);
}

module.exports = {
  secretsManagerFactory: (opts = {}) => {
    if (localstack) {
      opts = merge(clonedeep(opts), secretsManagerConfig)
    }
    return new AWS.SecretsManager(opts)
  },
  systemManagerFactory: (opts = {}) => {
    if (localstack) {
      opts = merge(clonedeep(opts), systemManagerConfig)
    }
    return new AWS.SSM(opts)
  },
  assumeRole: (assumeRoleOpts) => {
    const sts = new AWS.STS(stsConfig)
    if (fargate){
      return new Promise((resolve, reject) => {
        sts.assumeRoleWithWebIdentity(merge(assumeRoleOpts, {WebIdentityToken: loadServiceToken()}), (err, res) => {
          if (err) {
            return reject(err)
          }
          resolve(res)
        })
      })
    } else {
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
}
