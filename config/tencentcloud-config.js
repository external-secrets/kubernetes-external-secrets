'use strict'

// Tencent Cloud expects the following six environment variables:
// - TENCENTCLOUD_SECRET_ID: The access secret ID
// - TENCENTCLOUD_SECRET_KEY: The access secret key
// - TENCENTCLOUD_REGION: The current SSM service region
// - TENCENTCLOUD_METADATA_HOST: The host to Tencent Cloud meta-data server
// - TENCENTCLOUD_METADATA_PATH: The path to assume CVM attached role
// - TENCENTCLOUD_SSM_ENDPOINT: The SSM service endpoint

module.exports = {
  credential: {
    secretId: process.env.TENCENTCLOUD_SECRET_ID,
    secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
    region: process.env.TENCENTCLOUD_REGION,
    metadataHost: process.env.TENCENTCLOUD_METADATA_HOST || 'metadata.tencentyun.com',
    metadataPath: process.env.TENCENTCLOUD_METADATA_PATH || 'latest/meta-data/cam/security-credentials',
    ssmEndpoint: process.env.TENCENTCLOUD_SSM_ENDPOINT || 'ssm.tencentcloudapi.com'
  }
}
