'use strict'

const { RPCClient } = require('@alicloud/pop-core')

module.exports = {
  kmsClient: () => {
    const client = new RPCClient({
      accessKeyId: process.env.ALICLOUD_ACCESS_KEY,
      accessKeySecret: process.env.ALICLOUD_SECRET_KEY,
      endpoint: `https://kms.${process.env.ALICLOUD_REGION}.aliyuncs.com`,
      apiVersion: '2016-01-20'
    })
    return client
  }
}
