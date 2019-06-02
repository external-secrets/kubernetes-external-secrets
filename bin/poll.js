#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const {
  backends,
  customResourceManifest,
  kubeClient,
  logger
} = require('../config')

async function main () {
  const destinationPath = process.env['DESTINATION_PATH']
  const externalSecretName = process.env['EXTERNAL_SECRET_NAME']
  const namespace = process.env['EXTERNAL_SECRET_NAMESPACE']

  logger.info('loading kube specs')
  await kubeClient.loadSpec()
  kubeClient.addCustomResourceDefinition(customResourceManifest)
  logger.info('successfully loaded kube specs')

  const res = await kubeClient
    .apis[customResourceManifest.spec.group].v1
    .namespaces(namespace)[customResourceManifest.spec.names.plural](externalSecretName)
    .get()
  if (res.statusCode !== 200) {
    throw new Error(`Failed to fetch ExternalSecret: ${JSON.stringify(res, null, 2)}`)
  }

  const externalSecret = res.body
  const { secretDescriptor } = externalSecret
  const backend = backends[secretDescriptor.backendType]
  if (!backend) {
    throw new Error(`Unknown backend type: ${secretDescriptor.backendType}`)
  }

  const data = await backend.getSecretManifestData({ secretDescriptor })
  Object.entries(data).forEach(([filename, encodedContents]) => {
    const filenamePath = path.join(destinationPath, filename)
    const contents = Buffer.from(encodedContents, 'base64')
    fs.writeFileSync(filenamePath, contents) // eslint-disable-line security/detect-non-literal-fs-filename
  })
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
