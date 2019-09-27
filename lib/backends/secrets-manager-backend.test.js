/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const SecretsManagerBackend = require('./secrets-manager-backend')

describe('SecretsManagerBackend', () => {
  let clientMock
  let clientFactoryMock
  let assumeRoleMock
  let secretsManagerBackend
  const assumeRoleCredentials = {
    Credentials: {
      AccessKeyId: '1234',
      SecretAccessKey: '3123123',
      SessionToken: 'asdasdasdad'
    }
  }

  beforeEach(() => {
    clientMock = sinon.mock()
    clientFactoryMock = sinon.fake.returns(clientMock)
    assumeRoleMock = sinon.fake.returns(Promise.resolve(assumeRoleCredentials))
    secretsManagerBackend = new SecretsManagerBackend({
      clientFactory: clientFactoryMock,
      assumeRole: assumeRoleMock
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
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })

    it('returns secret property value assuming a role', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeAssumeRoleSecretValue'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        secretKey: 'fakeSecretKey',
        roleArn: 'my-role'
      })

      expect(clientFactoryMock.lastArg).deep.equals({
        accessKeyId: assumeRoleCredentials.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleCredentials.Credentials.SecretAccessKey,
        sessionToken: assumeRoleCredentials.Credentials.SessionToken
      })
      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        accessKeyId: assumeRoleCredentials.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleCredentials.Credentials.SecretAccessKey,
        sessionToken: assumeRoleCredentials.Credentials.SessionToken
      }])
      expect(assumeRoleMock.callCount).equals(1)
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
    })
  })
})
