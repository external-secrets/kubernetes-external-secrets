'use strict'

const { DefaultAzureCredential } = require('@azure/identity')
// DefaultAzureCredential expects the following three environment variables:
// - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
// - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
// - AZURE_CLIENT_SECRET: The client secret for the registered application

module.exports = {
  azureKeyVault: () => {
    const credential = new DefaultAzureCredential()
    return credential
  }
}
