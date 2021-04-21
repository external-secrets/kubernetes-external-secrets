/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const AkeylessBackend = require('./akeyless-backend')

describe('AkeylessBackend', () => {
  let loggerMock
  let clientMock
  let akeylessBackend

  const secret = 'fakeSecretValue'
  const key = 'secret_name'

  beforeEach(() => {
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientMock = sinon.mock()
    clientMock.getSecretValue = sinon.stub().returns({ [key]: secret })
    clientMock.getDynamicSecretValue = sinon.stub().returns(secret)
    clientMock.auth = sinon.stub().returns('token')
    clientMock.describeItem = sinon.stub().returns({ item_type: 'STATIC_SECRET' })

    akeylessBackend = new AkeylessBackend({
      credential: { endpoint: 'https//sampleendpoint', accessType: 'access_key', client: clientMock },
      logger: loggerMock
    })
  })

  describe('_get', () => {
    it('returns secret property value', async () => {
      const specOptions = {}
      const keyOptions = {}
      const secretPropertyValue = await akeylessBackend._get({
        key: key,
        specOptions,
        keyOptions
      })
      expect(secretPropertyValue).equals(secret)
    })
  })
})
