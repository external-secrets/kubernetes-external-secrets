'use strict'

const vault = require('node-vault')
const kube = require('kubernetes-client')
const KubeRequest = require('kubernetes-client/backends/request')
const pino = require('pino')
const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const awsConfig = require('./aws-config')
const azureConfig = require('./azure-config')
const alicloudConfig = require('./alicloud-config')
const gcpConfig = require('./gcp-config')
const envConfig = require('./environment')
const CustomResourceManager = require('../lib/custom-resource-manager')
const SecretsManagerBackend = require('../lib/backends/secrets-manager-backend')
const SystemManagerBackend = require('../lib/backends/system-manager-backend')
const VaultBackend = require('../lib/backends/vault-backend')
const AzureKeyVaultBackend = require('../lib/backends/azure-keyvault-backend')
const GCPSecretsManagerBackend = require('../lib/backends/gcp-secrets-manager-backend')
const AliCloudSecretsManagerBackend = require('../lib/backends/alicloud-secrets-manager-backend')

// Get document, or throw exception on error
// eslint-disable-next-line security/detect-non-literal-fs-filename
const customResourceManifest = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, '../charts/kubernetes-external-secrets/crds/kubernetes-client.io_externalsecrets_crd.yaml'), 'utf8'))
customResourceManifest.metadata.annotations['app.kubernetes.io/managed-by'] = 'custom-resource-manager'

const kubeconfig = new kube.KubeConfig()
kubeconfig.loadFromDefault()
const kubeBackend = new KubeRequest({ kubeconfig })
const kubeClient = new kube.Client({ backend: kubeBackend })

const logger = pino({
  serializers: {
    err: pino.stdSerializers.err
  },
  messageKey: envConfig.logMessageKey || 'msg',
  level: envConfig.logLevel,
  formatters: {
    level (label, number) {
      return { level: envConfig.useHumanReadableLogLevels ? label : number }
    }
  }
})

const customResourceManager = new CustomResourceManager({
  kubeClient,
  logger,
  disabled: envConfig.customResourceManagerDisabled
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
const vaultOptions = {
  apiVersion: 'v1',
  endpoint: envConfig.vaultEndpoint,
  requestOptions: {
    // When running vault in HA mode, you must follow redirects on PUT/POST/DELETE
    // See: https://github.com/kr1sp1n/node-vault/issues/23
    followAllRedirects: true
  }
}
// Include the Vault Namespace header if we have provided it as an env var.
// See: https://github.com/kr1sp1n/node-vault/pull/137#issuecomment-585309687
if (envConfig.vaultNamespace) {
  vaultOptions.requestOptions.headers = {
    'X-VAULT-NAMESPACE': envConfig.vaultNamespace
  }
}
const vaultClient = vault(vaultOptions)
const vaultBackend = new VaultBackend({ client: vaultClient, logger })
const azureKeyVaultBackend = new AzureKeyVaultBackend({
  credential: azureConfig.azureKeyVault(),
  logger
})
const gcpSecretsManagerBackend = new GCPSecretsManagerBackend({
  client: gcpConfig.gcpSecretsManager(),
  logger
})
const alicloudSecretsManagerBackend = new AliCloudSecretsManagerBackend({
  credential: alicloudConfig.credential,
  logger
})
const backends = {
  // when adding a new backend, make sure to change the CRD property too
  secretsManager: secretsManagerBackend,
  systemManager: systemManagerBackend,
  vault: vaultBackend,
  azureKeyVault: azureKeyVaultBackend,
  gcpSecretsManager: gcpSecretsManagerBackend,
  alicloudSecretsManager: alicloudSecretsManagerBackend

}

// backwards compatibility
backends.secretManager = secretsManagerBackend

module.exports = {
  awsConfig,
  backends,
  customResourceManager,
  customResourceManifest,
  ...envConfig,
  kubeClient,
  logger
}
