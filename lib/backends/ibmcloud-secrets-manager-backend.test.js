/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const IbmCloudSecretsManagerBackend = require('./ibmcloud-secrets-manager-backend')

// In the unit test suite, these tests mock calls to IBM Secrets Manager, but mocking can be disabled during development to validate actual operation.
// To diable mocking and enable real calls to an instance of Secrets Manager:
//
// 1. Set the three credential environment variables:
//      SECRETS_MANAGER_API_AUTH_TYPE=iam
//      SECRETS_MANAGER_API_ENDPOINT=https://{instance-id}.{region}.secrets-manager.appdomain.cloud
//      SECRETS_MANAGER_API_APIKEY={API key with Read+ReadSecrets access to the instance}
//
// 2. Add the three secrets described in the data object below to Secrets Manager.
//    When you add the IAM secret, be sure that "Reuse IAM credentials until lease expires" is checked.
//
// 3. Set the following three environment variables to the IDs of those secrets:
//      IBM_CLOUD_SECRETS_MANAGER_TEST_CREDS_ID
//      IBM_CLOUD_SECRETS_MANAGER_TEST_SECRET_ID
//      IBM_CLOUD_SECRETS_MANAGER_TEST_IAM_ID
//
// 4. Set the following environment variable to the API key generated as part of the IAM credential:
//      IBM_CLOUD_SECRETS_MANAGER_TEST_IAM_APIKEY
//
// Note: In the Secrets Manager UI, you can select "Show snippet" from the secret's overflow menu to show a curl command that will retrieve the value.
// Or you can use the "ibmcloud sm secret" CLI command to handle authentication for you.
//
// You can switch back to mocking simply by unsetting SECRETS_MANAGER_API_AUTH_TYPE.
// This makes it easy to switch back and forth between the two modes when writing new tests.

const endpoint = process.env.IBM_CLOUD_SECRETS_MANAGER_API_ENDPOINT || 'https://fake.secrets-manager.appdomain.cloud'

const data = {
  creds: {
    id: process.env.IBM_CLOUD_SECRETS_MANAGER_TEST_CREDS_ID || 'id1',
    name: 'test-creds',
    secretType: 'username_password',
    username: 'johndoe',
    password: 'p@ssw0rd'
  },
  secret: {
    id: process.env.IBM_CLOUD_SECRETS_MANAGER_TEST_SECRET_ID || 'id2',
    name: 'test-secret',
    secretType: 'arbitrary',
    payload: 's3cr3t'
  },
  iam: {
    id: process.env.IBM_CLOUD_SECRETS_MANAGER_TEST_IAM_ID || 'id3',
    name: 'test-iam',
    secretType: 'iam_credentials',
    apiKey: process.env.IBM_CLOUD_SECRETS_MANAGER_TEST_IAM_APIKEY || 'key'
  }
}

describe('IbmCloudSecretsManagerBackend', () => {
  const mock = !process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE
  let loggerMock
  let ibmCloudSecretsManagerBackend

  beforeEach(() => {
    if (mock) {
      process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE = 'noauth'
    }

    loggerMock = {
      info: sinon.stub()
    }

    ibmCloudSecretsManagerBackend = new IbmCloudSecretsManagerBackend({
      credential: { endpoint },
      logger: loggerMock
    })
  })

  afterEach(() => {
    if (mock) {
      delete process.env.IBM_CLOUD_SECRETS_MANAGER_API_AUTH_TYPE
      ibmCloudSecretsManagerBackend._secretsManagerClient.restore()
    }
  })

  function mockClient ({ list = [], get = {} }) {
    if (mock) {
      const client = {
        listAllSecrets: sinon.stub().resolves({ result: { resources: list } }),
        getSecret: sinon.stub().resolves({ result: { resources: [get] } })
      }
      sinon.stub(ibmCloudSecretsManagerBackend, '_secretsManagerClient').returns(client)
    }
  }

  describe('_get', () => {
    describe('with default spec options', () => {
      it('returns a username_password secret', async () => {
        const { id, secretType, username, password } = data.creds
        mockClient({ get: { secret_data: { password, username } } })

        const secretPropertyValue = await ibmCloudSecretsManagerBackend._get({
          key: id,
          specOptions: {},
          keyOptions: { secretType }
        })
        expect(secretPropertyValue).equals('{"password":"p@ssw0rd","username":"johndoe"}')
      })

      it('returns an arbitrary secret', async () => {
        const { id, secretType, payload } = data.secret
        mockClient({ get: { secret_data: { payload } } })

        const secretPropertyValue = await ibmCloudSecretsManagerBackend._get({
          key: id,
          specOptions: {},
          keyOptions: { secretType }
        })
        expect(secretPropertyValue).equals('{"payload":"s3cr3t"}')
      })

      it('returns an API key from an iam_credentials secret', async () => {
        const { id, secretType, apiKey } = data.iam
        mockClient({ get: { api_key: apiKey } })

        const secretPropertyValue = await ibmCloudSecretsManagerBackend._get({
          key: id,
          specOptions: {},
          keyOptions: { secretType }
        })
        expect(secretPropertyValue).equals(`"${apiKey}"`)
      })
    })

    describe('with key by name enabled', () => {
      it('returns a secret that matches the given name and type', async () => {
        const { name, secretType, username, password } = data.creds
        const list = [
          { name, secret_type: 'arbitrary' },
          { name, secret_type: secretType },
          { name: 'test-creds2', secret_type: secretType }
        ]
        mockClient({ list, get: { secret_data: { password, username } } })

        const secretPropertyValue = await ibmCloudSecretsManagerBackend._get({
          key: name,
          specOptions: { keyByName: true },
          keyOptions: { secretType }
        })
        expect(secretPropertyValue).equals('{"password":"p@ssw0rd","username":"johndoe"}')
      })

      it('throws if there is no secret with the given name and type', async () => {
        mockClient({ list: [] })

        try {
          await ibmCloudSecretsManagerBackend._get({
            key: 'test-missing',
            specOptions: { keyByName: true },
            keyOptions: { secretType: 'username_password' }
          })
        } catch (error) {
          expect(error).to.have.property('message').that.includes('No username_password secret')
          return
        }
        expect.fail('expected to throw an error')
      })

      // Defensive test: this condition does not appear to be possible currently with a real Secrets Manager instance.
      if (mock) {
        it('throws if there are multiple secrets with the given name and type', async () => {
          const { name, secretType, username, password } = data.creds
          const list = [
            { name, secret_type: secretType },
            { name, secret_type: secretType }
          ]
          mockClient({ list, get: { secret_data: { password, username } } })

          try {
            await ibmCloudSecretsManagerBackend._get({
              key: name,
              specOptions: { keyByName: true },
              keyOptions: { secretType }
            })
          } catch (error) {
            expect(error).to.have.property('message').that.includes('Multiple username_password secrets')
            return
          }
          expect.fail('expected to throw an error')
        })
      }
    })
  })
})
