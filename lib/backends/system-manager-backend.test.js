/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const SystemManagerBackend = require('./system-manager-backend')

describe('SystemManagerBackend', () => {
  let clientMock
  let systemManagerBackend

  beforeEach(() => {
    clientMock = sinon.mock()

    systemManagerBackend = new SystemManagerBackend({
      client: clientMock
    })
  })

  describe('_get', () => {
    let getParameterPromise

    beforeEach(() => {
      getParameterPromise = sinon.mock()
      getParameterPromise.promise = sinon.stub()
      clientMock.getParameter = sinon.stub().returns(getParameterPromise)
    })

    it('returns secret property value', async () => {
      getParameterPromise.promise.resolves({
        Value: 'fakeSecretPropertyValue'
      })

      const secretPropertyValue = await systemManagerBackend._get({
        secretKey: 'fakeSecretKey'
      })

      expect(clientMock.getParameter.calledWith({
        Name: 'fakeSecretKey',
        WithDecryption: true
      })).to.equal(true)
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })
  })
})
