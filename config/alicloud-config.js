'use strict'

// Alibaba Cloud expects the following four environment variables:
// - ALICLOUD_ENDPOINT: endpoint URL http(s)://kms.{regionID}.aliyuncs.com or http(s)://kms-vpc.{regionID}.aliyuncs.com
// - ALICLOUD_ACCESS_KEY_ID: The access key ID
// - ALICLOUD_ACCESS_KEY_SECRET: The access key secret

module.exports = {
  credential: {
    accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
    endpoint: process.env.ALICLOUD_ENDPOINT,
    type: 'access_key'
  }
}
