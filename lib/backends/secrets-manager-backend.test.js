/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const SecretsManagerBackend = require('./secrets-manager-backend')

describe('SecretsManagerBackend', () => {
  let clientMock
  let secretsManagerBackend

  beforeEach(() => {
    clientMock = sinon.mock()

    secretsManagerBackend = new SecretsManagerBackend({
      client: clientMock
    })
  })

  describe('_get', () => {
    let getSecretValuePromise

    beforeEach(() => {
      getSecretValuePromise = sinon.mock()
      getSecretValuePromise.promise = sinon.stub()
      clientMock.getSecretValue = sinon.stub().returns(getSecretValuePromise)
    })

    it('returns secret property value', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeSecretPropertyValue'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        secretKey: 'fakeSecretKey'
      })

      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey'
      })).to.equal(true)
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })
  })
})
