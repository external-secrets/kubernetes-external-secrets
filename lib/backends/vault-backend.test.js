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
  const mountPoint = 'fakeMountPoint'
  const role = 'fakeRole'
  const secretKey = 'fakeSecretKey'
  const secretValue = 'open, sesame'
  const quotedSecretValue = '"' + secretValue + '"'
  const quotedSecretValueAsBase64 = Buffer.from(quotedSecretValue).toString('base64')
  const jwt = 'this-is-a-jwt-token'

  beforeEach(() => {
    clientMock = sinon.mock()

    vaultBackend = new VaultBackend({
      client: clientMock,
      logger
    })
  })

  describe('_get', () => {
    beforeEach(() => {
      clientMock.read = sinon.stub().returns({
        data: {
          data: secretValue
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
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // First, we log into Vault...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: mountPoint,
        role: role,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value after renewing token if a token exists', async () => {
      clientMock.token = 'an-existing-token'

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // No logging into Vault...
      sinon.assert.notCalled(clientMock.kubernetesLogin)

      // ... but renew the token instead ...
      sinon.assert.calledOnce(clientMock.tokenRenewSelf)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })
  })

  describe('getSecretManifestData', () => {
    beforeEach(() => {
      clientMock.read = sinon.stub().returns({ data: { data: secretValue } })
      clientMock.tokenRenewSelf = sinon.stub().returns(true)
      clientMock.kubernetesLogin = sinon.stub().returns({ auth: { client_token: '1234' } })

      vaultBackend._fetchServiceAccountToken = sinon.stub().returns(jwt)

      clientMock.token = undefined
    })

    it('logs in and returns secret property value', async () => {
      const returnedData = await vaultBackend.getSecretManifestData({
        spec: {
          backendType: 'vault',
          vaultRole: role,
          vaultMountPoint: mountPoint,
          data: [{
            key: secretKey,
            name: secretKey
          }]
        }
      })

      // First, we log into Vault...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: mountPoint,
        role: role,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get the full proper value
      expect(returnedData[secretKey]).equals(quotedSecretValueAsBase64)
    })
  })
})
