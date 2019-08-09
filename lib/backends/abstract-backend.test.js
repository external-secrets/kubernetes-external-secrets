/* eslint-env mocha */
'use strict'

const { expect } = require('chai')

const AbstractBackend = require('./abstract-backend')

describe('AbstractBackend', () => {
  let abstractBackend

  beforeEach(() => {
    abstractBackend = new AbstractBackend()
  })

  describe('getSecretManifestData', () => {
    it('throws an error', () => {
      let error

      try {
        abstractBackend.getSecretManifestData()
      } catch (err) {
        error = err
      }

      expect(error).to.not.equal(undefined)
      expect(error.message).equals('getSecretManifestData not implemented')
    })
  })
})
