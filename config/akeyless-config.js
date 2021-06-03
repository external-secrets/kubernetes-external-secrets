'use strict'
const akeyless = require('akeyless')
const AkeylessClient = new akeyless.ApiClient()
AkeylessClient.basePath = process.env.AKEYLESS_API_ENDPOINT || 'https://api.akeyless.io'

// Akeyless  expects the following four environment variables:
// - AKEYLESS_API_ENDPOINT: api-gw endpoint URL http(s)://api.akeyless.io
// - AKEYLESS_ACCESS_ID: The access ID
// - AKEYLESS_ACCESS_TYPE: The access type
// - AKEYLESS_ACCESS_TYPE_PARAM: AZURE_OBJ_ID OR GCP_AUDIENCE OR ACCESS_KEY

const client = new akeyless.V2Api(AkeylessClient)
module.exports = {
  credential: {
    accessTypeParam: process.env.AKEYLESS_ACCESS_TYPE_PARAM,
    accessId: process.env.AKEYLESS_ACCESS_ID,
    accessType: process.env.AKEYLESS_ACCESS_TYPE,
    client: client
  }
}
