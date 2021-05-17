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
  let clientMock2
  let vaultBackend
  const defaultFakeMountPoint = 'defaultFakeMountPoint'
  const defaultFakeRole = 'defaultFakeRole'
  const mountPoint = 'fakeMountPoint'
  const mountPoint2 = 'fakeMountPoint2'
  const role = 'fakeRole'
  const role2 = 'fakeRole2'
  const secretKey = 'fakeSecretKey'
  const secretValue = 'open, sesame'
  const secretData = { [secretKey]: secretValue }
  const quotedSecretValue = JSON.stringify(secretData)
  const quotedSecretValueAsBase64 = Buffer.from(quotedSecretValue).toString('base64')
  const jwt = 'this-is-a-jwt-token'

  const kv1Secret = {
    data: secretData
  }

  const kv2Secret = {
    data: {
      data: secretData
    }
  }

  const vaultTokenRenewThreshold = 30

  const mockTokenLookupResultMustRenew = {
    data: {
      ttl: 15
    }
  }
  const mockTokenLookupResultNoRenew = {
    data: {
      ttl: 60
    }
  }

  beforeEach(() => {
    clientMock = sinon.mock()
    clientMock2 = sinon.mock()
    let mock = 0
    vaultBackend = new VaultBackend({
      vaultFactory: () => mock++ === 0 ? clientMock : clientMock2,
      tokenRenewThreshold: vaultTokenRenewThreshold,
      logger: logger,
      defaultVaultMountPoint: defaultFakeMountPoint,
      defaultVaultRole: defaultFakeRole
    })
  })

  describe('_get', () => {
    beforeEach(() => {
      clientMock.read = sinon.stub().returns(kv2Secret)
      clientMock.token = undefined
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)
      clientMock.tokenRenewSelf = sinon.stub().returns(true)
      clientMock.kubernetesLogin = sinon.stub().returns({
        auth: {
          client_token: '1234'
        }
      })

      clientMock2.read = sinon.stub().returns(kv2Secret)
      clientMock2.token = undefined
      clientMock2.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)
      clientMock2.tokenRenewSelf = sinon.stub().returns(true)
      clientMock2.kubernetesLogin = sinon.stub().returns({
        auth: {
          client_token: '5678'
        }
      })

      vaultBackend._fetchServiceAccountToken = sinon.stub().returns(jwt)
    })

    it('logs in and returns secret property value - default', async () => {
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

    it('if vaultRole and vaultMountPoint not specified use the default one', async () => {
      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
        },
        key: secretKey
      })

      // First, we log into Vault...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: defaultFakeMountPoint,
        role: defaultFakeRole,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('logs in and returns secret property value - kv version 1', async () => {
      clientMock.read = sinon.stub().returns(kv1Secret)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role,
          kvVersion: 1
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

    it('logs in and returns secret property value - kv version 2', async () => {
      clientMock.read = sinon.stub().returns(kv2Secret)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role,
          kvVersion: 2
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

    it('returns secret property value after renewing token if a token exists that needs renewal', async () => {
      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // No logging into Vault...
      sinon.assert.notCalled(clientMock.kubernetesLogin)

      // ... but check the token instead ...
      sinon.assert.calledOnce(clientMock.tokenLookupSelf)

      // ... then renew the token ...
      sinon.assert.calledOnce(clientMock.tokenRenewSelf)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value after failed renew token and then relogin', async () => {
      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)
      clientMock.tokenRenewSelf = sinon.stub().returns(false)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // check the token happened ...
      sinon.assert.calledOnce(clientMock.tokenLookupSelf)

      // ... then try to renew the token ...
      sinon.assert.calledOnce(clientMock.tokenRenewSelf)

      // ... now relogin due to failure to renew ...
      sinon.assert.calledOnce(clientMock.kubernetesLogin)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value after errored token inspection and then relogin', async () => {
      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().throws(new Error())
      clientMock.tokenRenewSelf = sinon.stub().returns(false)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // check the token happened ...
      sinon.assert.calledOnce(clientMock.tokenLookupSelf)

      // ... didn't try to renew the token ...
      sinon.assert.notCalled(clientMock.tokenRenewSelf)

      // ... but instead just relogin due to error upon inspection ...
      sinon.assert.calledOnce(clientMock.kubernetesLogin)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value after errored token renewal and then relogin', async () => {
      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)
      clientMock.tokenRenewSelf = sinon.stub().throws(new Error())

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // check the token happened ...
      sinon.assert.calledOnce(clientMock.tokenLookupSelf)

      // ... didn't try to renew the token ...
      sinon.assert.calledOnce(clientMock.tokenRenewSelf)

      // ... but instead just relogin due to error upon renewal ...
      sinon.assert.calledOnce(clientMock.kubernetesLogin)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value if a token exists that does not need renewal', async () => {
      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultNoRenew)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // No logging into Vault...
      sinon.assert.notCalled(clientMock.kubernetesLogin)

      // ... but check the token instead ...
      sinon.assert.calledOnce(clientMock.tokenLookupSelf)

      // ... and token does not need renewal ...
      sinon.assert.notCalled(clientMock.tokenRenewSelf)

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)
    })

    it('returns secret property value using client associated with role given in _get', async () => {
      clientMock.read = sinon.stub().returns(kv2Secret)
      clientMock2.read = sinon.stub().returns(kv2Secret)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // First, we log into Vault with role 1...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: mountPoint,
        role: role,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)

      const secretPropertyValue2 = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role2
        },
        key: secretKey
      })

      // Now ensure we log into Vault with role 2...
      sinon.assert.calledWith(clientMock2.kubernetesLogin, {
        mount_point: mountPoint,
        role: role2,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock2.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue2).equals(quotedSecretValue)
    })

    it('returns secret property value using client associated with mountpoint given in _get', async () => {
      clientMock.read = sinon.stub().returns(kv2Secret)
      clientMock2.read = sinon.stub().returns(kv2Secret)

      const secretPropertyValue = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // First, we log into Vault with mountpoint 1...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: mountPoint,
        role: role,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue).equals(quotedSecretValue)

      const secretPropertyValue2 = await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint2,
          vaultRole: role
        },
        key: secretKey
      })

      // Now ensure we log into Vault with mountpoint 2...
      sinon.assert.calledWith(clientMock2.kubernetesLogin, {
        mount_point: mountPoint2,
        role: role,
        jwt: jwt
      })

      // ... then we fetch the secret ...
      sinon.assert.calledWith(clientMock2.read, secretKey)

      // ... and expect to get its proper value
      expect(secretPropertyValue2).equals(quotedSecretValue)
    })

    it('ensure we cache the clients for each role', async () => {
      clientMock.read = sinon.stub().returns(kv2Secret)
      clientMock2.read = sinon.stub().returns(kv2Secret)

      await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      // First, we log into Vault with role 1...
      sinon.assert.calledWith(clientMock.kubernetesLogin, {
        mount_point: mountPoint,
        role: role,
        jwt: jwt
      })
      sinon.assert.calledOnce(clientMock.read)

      clientMock.token = 'an-existing-token'
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultNoRenew)

      // now we have active role 1 client, we now activate role 2 client

      await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role2
        },
        key: secretKey
      })

      // we log into Vault with role 2...
      sinon.assert.calledWith(clientMock2.kubernetesLogin, {
        mount_point: mountPoint,
        role: role2,
        jwt: jwt
      })
      sinon.assert.calledOnce(clientMock2.read)

      clientMock2.token = 'an-existing-token'
      clientMock2.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultNoRenew)

      // Back to role1
      await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role
        },
        key: secretKey
      })

      sinon.assert.calledOnce(clientMock.kubernetesLogin)
      sinon.assert.calledTwice(clientMock.read)

      await vaultBackend._get({
        specOptions: {
          vaultMountPoint: mountPoint,
          vaultRole: role2
        },
        key: secretKey
      })

      sinon.assert.calledOnce(clientMock2.kubernetesLogin)
      sinon.assert.calledTwice(clientMock2.read)
    })
  })

  describe('getSecretManifestData', () => {
    beforeEach(() => {
      clientMock.read = sinon.stub().returns(kv2Secret)
      clientMock.tokenLookupSelf = sinon.stub().returns(mockTokenLookupResultMustRenew)
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
