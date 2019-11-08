/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const SystemManagerBackend = require('./system-manager-backend')

describe('SystemManagerBackend', () => {
  let clientMock
  let loggerMock
  let clientFactoryMock
  let assumeRoleMock
  let systemManagerBackend
  const specOptions = {}

  const assumeRoleCredentials = {
    Credentials: {
      AccessKeyId: '1234',
      SecretAccessKey: '3123123',
      SessionToken: 'asdasdasdad'
    }
  }

  beforeEach(() => {
    clientMock = sinon.mock()
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientFactoryMock = sinon.fake.returns(clientMock)
    assumeRoleMock = sinon.fake.returns(Promise.resolve(assumeRoleCredentials))

    systemManagerBackend = new SystemManagerBackend({
      client: clientMock,
      clientFactory: clientFactoryMock,
      assumeRole: assumeRoleMock,
      logger: loggerMock
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
        Parameter: {
          Value: 'fakeSecretPropertyValue'
        }
      })

      const secretPropertyValue = await systemManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions
      })

      expect(clientMock.getParameter.calledWith({
        Name: 'fakeSecretKey',
        WithDecryption: true
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })

    it('returns secret property value assuming a role', async () => {
      getParameterPromise.promise.resolves({
        Parameter: {
          Value: 'fakeAssumeRoleSecretValue'
        }
      })

      const secretPropertyValue = await systemManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions: { roleArn: 'my-role' }
      })
      expect(clientFactoryMock.lastArg).deep.equals({
        accessKeyId: assumeRoleCredentials.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleCredentials.Credentials.SecretAccessKey,
        sessionToken: assumeRoleCredentials.Credentials.SessionToken
      })
      expect(clientMock.getParameter.calledWith({
        Name: 'fakeSecretKey',
        WithDecryption: true
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        accessKeyId: assumeRoleCredentials.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleCredentials.Credentials.SecretAccessKey,
        sessionToken: assumeRoleCredentials.Credentials.SessionToken
      }])
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
    })
  })
})
