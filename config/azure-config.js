'use strict'

const { DefaultAzureCredential, AzureAuthorityHosts } = require('@azure/identity')
// DefaultAzureCredential expects the following three environment variables:
// - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
// - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
// - AZURE_CLIENT_SECRET: The client secret for the registered application
// An optional environment variable AZURE_ENVIRONMENT may be provided to specify cloud environment

const authorityHostMap = new Map()
authorityHostMap.set('AzureCloud', AzureAuthorityHosts.AzurePublicCloud)
authorityHostMap.set('AzureChinaCloud', AzureAuthorityHosts.AzureChina)
authorityHostMap.set('AzureGermanCloud', AzureAuthorityHosts.AzureGermany)
authorityHostMap.set('AzureUSGovernment', AzureAuthorityHosts.AzureGovernment)

module.exports = {
  azureKeyVault: () => {
    var env = process.env.AZURE_ENVIRONMENT
    if (!env) {
      env = 'AzureCloud' // default
    }
    var host = authorityHostMap.get(env)
    const credential = new DefaultAzureCredential({ authorityHost: host })
    return credential
  }
}
