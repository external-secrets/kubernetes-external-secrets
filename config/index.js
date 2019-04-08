'use strict'

const AWS = require('aws-sdk')
const kube = require('kubernetes-client')
const pino = require('pino')

const envConfig = require('./environment')
const CustomResourceManager = require('../lib/custom-resource-manager')
const customResourceManifest = require('../custom-resource-manifest.json')
const SecretsManagerBackend = require('../lib/backends/secrets-manager-backend')
const SystemManagerBackend = require('../lib/backends/system-manager-backend')

let kubeClientConfig
try {
  kubeClientConfig = kube.config.getInCluster()
} catch (err) {
  kubeClientConfig = kube.config.fromKubeconfig()
}
const kubeClient = new kube.Client({ config: kubeClientConfig })

const logger = pino({
  serializers: {
    err: pino.stdSerializers.err
  }
})

const customResourceManager = new CustomResourceManager({
  kubeClient,
  logger
})

const secretsManagerClient = new AWS.SecretsManager({ region: envConfig.awsRegion })
const secretsManagerBackend = new SecretsManagerBackend({ client: secretsManagerClient, logger })
const systemManagerClient = new AWS.SSM({ region: envConfig.awsRegion })
const systemManagerBackend = new SystemManagerBackend({ client: systemManagerClient, logger })
const backends = {
  secretsManager: secretsManagerBackend,
  systemManager: systemManagerBackend
}

// backwards compatibility
backends.secretManager = secretsManagerBackend

module.exports = {
  backends,
  customResourceManager,
  customResourceManifest,
  ...envConfig,
  kubeClient,
  logger
}
