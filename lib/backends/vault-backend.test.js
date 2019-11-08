/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const pino = require('pino')

const VaultBackend = require('./vault-backend')
const logger = pino({
  serializers: {
    err: pino.stdSerializers.err
  }
})

describe('VaultBackend', () => {
  let clientMock
  let vaultBackend

  beforeEach(() => {
    clientMock = sinon.mock()

    vaultBackend = new VaultBackend({
      client: clientMock,
      logger
    })
  })

  describe('_get', () => {
    const mountPoint = 'fakeMountPoint'
    const role = 'fakeRole'
    const secretKey = 'fakeSecretKey'
    const jwt = 'this-is-a-jwt-token'

    beforeEach(() => {
      clientMock.read = sinon.stub().returns({
        data: {
          data: 'fakeSecretPropertyValue'
        }
      })
      clientMock.tokenRenewSelf = sinon.stub().returns(true)
      clientMock.kubernetesLogin = sinon.stub().returns({
        auth: {
          client_token: '1234'
        }
      })

      vaultBackend._fetchServiceAccountToken = sinon.stub().returns(jwt)

      clientMock.token = undefined
    })

    it('logs in and returns secret property value', async () => {
      const secretPropertyValue = await vaultBackend._get({
        vaultMountPoint: mountPoint,
        vaultRole: role,
        secretKey: secretKey
      })

      // First, we log into Vault...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: 'fakeMountPoint',
        role: 'fakeRole',
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, 'fakeSecretKey')

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })

    it('returns secret property value after renewing token if a token exists', async () => {
      clientMock.token = 'an-existing-token'

      const secretPropertyValue = await vaultBackend._get({
        vaultMountPoint: mountPoint,
        vaultRole: role,
        secretKey: secretKey
      })

      // No logging into Vault...
      sinon.assert.notCalled(clientMock.kubernetesLogin)

      // ... but renew the token instead ...
      sinon.assert.calledOnce(clientMock.tokenRenewSelf)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, 'fakeSecretKey')

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })
  })
})
