'use strict'

const {
  kubeClient
} = require('../../config')

/**
 * "delays" the async execution
 * @param {Number} ms - number of milliseconds to wait
 */
async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * generate a uuid for this e2e run
 * taken from https://gist.github.com/6174/6062387
 */
const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

/**
 * wait for a secret to appear in a given namespace
 * this function polls the apiserver for updates in 100ms intervals (max 3s)
 * @param {String} ns - namespace
 * @param {String} name - secret name
 * @return {Secret|undefined}
 */
const waitForSecret = async (ns, name) => {
  for (let i = 0; i <= 30; i++) {
    try {
      const secret = await kubeClient
        .api.v1
        .namespaces(ns)
        .secrets(name).get()
      return secret
    } catch (e) {
      await delay(100)
    }
  }
}

module.exports = {
  uuid,
  delay,
  waitForSecret
}
