'use strict'

const kube = require('kubernetes-client')
const KubeRequest = require('kubernetes-client/backends/request')
const pino = require('pino')
const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const awsConfig = require('./aws-config')
const envConfig = require('./environment')
const CustomResourceManager = require('../lib/custom-resource-manager')
const SecretsManagerBackend = require('../lib/backends/secrets-manager-backend')
const SystemManagerBackend = require('../lib/backends/system-manager-backend')

// Get document, or throw exception on error
// eslint-disable-next-line security/detect-non-literal-fs-filename
const customResourceManifest = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../crd.yaml'), 'utf8'))

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

const secretsManagerBackend = new SecretsManagerBackend({
  clientFactory: awsConfig.secretsManagerFactory,
  assumeRole: awsConfig.assumeRole,
  logger
})
const systemManagerBackend = new SystemManagerBackend({
  clientFactory: awsConfig.systemManagerFactory,
  assumeRole: awsConfig.assumeRole,
  logger
})
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
