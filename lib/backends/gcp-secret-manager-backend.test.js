'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const GCPSecretManagerBackend = require('./gcp-secret-manager-backend')

describe('GCPSecretManagerBackend', () => {
  let clientMock
  let loggerMock
  let gcpSecretManagerBackend
  const secretKey = 'fakeSecretKey'
  const secretValue = 'fakeSecretValue'
  const quotedSecretValue = '"' + secretValue + '"'

  beforeEach(() => {
    loggerMock = sinon.mock()
    clientMock = sinon.mock()

    gcpSecretManagerBackend = new GCPSecretManagerBackend({
      client: clientMock,
      logger: loggerMock
    })
  })

  describe('_get', () => {
    beforeEach(() => {
      clientMock.accessSecretVersion = sinon.stub().returns({
		payload: {
		    data: secretValue
		}
      })
      projectId='123'
    })

    it('returns secret property value', async () => {
      const secretPropertyValue = await gcpSecretManagerBackend._get({
        key: {
          key: secretKey
       }
      })
      expect(secretPropertyValue.payload.data.toString('utf8')).equals(quotedSecretValue)
    })
  })
})