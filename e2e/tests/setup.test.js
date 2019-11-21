/* eslint-env mocha */
'use strict'

const {
  kubeClient
} = require('../../config')

before(async () => {
  await kubeClient.loadSpec()
})
