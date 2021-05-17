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
    fakeObject: 'Fake mock object'
  }

  beforeEach(() => {
    clientMock = sinon.mock()
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientFactoryMock = sinon.fake.returns(clientMock)
    assumeRoleMock = sinon.fake.returns(assumeRoleCredentials)

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

    it('returns secret property value assuming a role with region', async () => {
      getParameterPromise.promise.resolves({
        Parameter: {
          Value: 'fakeAssumeRoleSecretValue'
        }
      })

      const secretPropertyValue = await systemManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions: {
          roleArn: 'my-role',
          region: 'my-region'
        }
      })
      expect(clientFactoryMock.lastArg).deep.equals({
        credentials: assumeRoleCredentials,
        region: 'my-region'
      })
      expect(clientMock.getParameter.calledWith({
        Name: 'fakeSecretKey',
        WithDecryption: true
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        credentials: assumeRoleCredentials,
        region: 'my-region'
      }])
      expect(assumeRoleMock.callCount).equals(1)
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
    })

    it('returns secret property value from specific region', async () => {
      getParameterPromise.promise.resolves({
        Parameter: {
          Value: 'fakeAssumeRoleSecretValue'
        }
      })

      const secretPropertyValue = await systemManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions: {
          region: 'my-region'
        }
      })
      expect(clientFactoryMock.lastArg).deep.equals({
        region: 'my-region'
      })
      expect(clientMock.getParameter.calledWith({
        Name: 'fakeSecretKey',
        WithDecryption: true
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        region: 'my-region'
      }])
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
      expect(assumeRoleMock.callCount).equals(0)
    })

    it('throws a meaningful message when the parameter does not exist', async () => {
      const error = new Error(null)
      error.code = 'ParameterNotFound'
      error.name = 'ParameterNotFound'

      getParameterPromise.promise.rejects(error)

      try {
        await systemManagerBackend._get({
          key: 'fakeSecretKey',
          specOptions
        })
      } catch (err) {
        expect(err.message).equals('ParameterNotFound: fakeSecretKey could not be found.')
      }
    })
  })
})
