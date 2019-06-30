'use strict'

const AWS = require('aws-sdk')
const kube = require('kubernetes-client')
const KubeRequest = require('kubernetes-client/backends/request')
const pino = require('pino')

const awsConfig = require('./aws-config')
const envConfig = require('./environment')
const CustomResourceManager = require('../lib/custom-resource-manager')
const customResourceManifest = require('../custom-resource-manifest.json')
const SecretsManagerBackend = require('../lib/backends/secrets-manager-backend')
const SystemManagerBackend = require('../lib/backends/system-manager-backend')

const kubeconfig = new kube.KubeConfig()
kubeconfig.loadFromDefault()
const kubeBackend = new KubeRequest({ kubeconfig })
const kubeClient = new kube.Client({ backend: kubeBackend })

const logger = pino({
  serializers: {
    err: pino.stdSerializers.err
  },
  level: envConfig.logLevel
})

const customResourceManager = new CustomResourceManager({
  kubeClient,
  logger
})

const secretsManagerClient = new AWS.SecretsManager(awsConfig.secretsManagerConfig)
const secretsManagerBackend = new SecretsManagerBackend({ client: secretsManagerClient, logger })
const systemManagerClient = new AWS.SSM(awsConfig.systemManagerConfig)
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
