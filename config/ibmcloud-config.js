'use strict'

// IBM Cloud automatically picks up the following credentials so they don't have to be passed in the config
// - SECRETS_MANAGER_API_AUTH_TYPE=iam
// - SECRETS_MANAGER_API_APIKEY=<apikey>
// - SECRETS_MANAGER_API_ENDPOINT= endpoint URL https://{instance-id}.{region}.secrets-manager.appdomain.cloud

module.exports = {
  credential: {
    apikey: process.env.IBM_CLOUD_SECRETS_MANAGER_API_APIKEY,
    endpoint: process.env.IBM_CLOUD_SECRETS_MANAGER_API_ENDPOINT,
    type: process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE
  }
}
