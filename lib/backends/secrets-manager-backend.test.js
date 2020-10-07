/* eslint-env mocha */
'use strict'

const { expect } = require('chai')
const sinon = require('sinon')

const SecretsManagerBackend = require('./secrets-manager-backend')

describe('SecretsManagerBackend', () => {
  let clientMock
  let loggerMock
  let clientFactoryMock
  let assumeRoleMock
  let secretsManagerBackend
  const specOptions = {}
  const keyOptions = {}

  const assumeRoleCredentials = {
    fakeObject: 'Fake mock object'
  }

  beforeEach(() => {
    clientMock = sinon.mock()
    loggerMock = sinon.mock()
    loggerMock.info = sinon.stub()
    clientFactoryMock = sinon.fake.returns(clientMock)
    assumeRoleMock = sinon.fake.returns(assumeRoleCredentials)
    secretsManagerBackend = new SecretsManagerBackend({
      clientFactory: clientFactoryMock,
      assumeRole: assumeRoleMock,
      logger: loggerMock
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
        key: 'fakeSecretKey',
        specOptions,
        keyOptions
      })

      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionStage: 'AWSCURRENT'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeSecretPropertyValue')
    })

    it('returns binary secret', async () => {
      getSecretValuePromise.promise.resolves({
        SecretBinary: Buffer.from('fakeSecretPropertyValue', 'utf-8')
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions,
        keyOptions
      })

      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionStage: 'AWSCURRENT'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue.toString()).equals('fakeSecretPropertyValue')
    })

    it('returns secret property value assuming a role with region', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeAssumeRoleSecretValue'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions: {
          roleArn: 'my-role',
          region: 'foo-bar-baz'
        },
        keyOptions
      })

      expect(clientFactoryMock.lastArg).deep.equals({
        credentials: assumeRoleCredentials,
        region: 'foo-bar-baz'
      })
      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionStage: 'AWSCURRENT'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        credentials: assumeRoleCredentials,
        region: 'foo-bar-baz'
      }])
      expect(assumeRoleMock.callCount).equals(1)
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
    })

    it('returns secret property value from specific region', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeAssumeRoleSecretValue'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions: { region: 'my-region' },
        keyOptions
      })

      expect(clientFactoryMock.lastArg).deep.equals({
        region: 'my-region'
      })
      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionStage: 'AWSCURRENT'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(clientFactoryMock.getCall(1).args).deep.equals([{
        region: 'my-region'
      }])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeAssumeRoleSecretValue')
    })

    it('returns secret property value with versionStage', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeSecretPropertyValuePreviousVersion'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions,
        keyOptions: {
          versionStage: 'AWSPREVIOUS'
        }
      })

      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionStage: 'AWSPREVIOUS'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeSecretPropertyValuePreviousVersion')
    })

    it('returns secret property value with versionId', async () => {
      getSecretValuePromise.promise.resolves({
        SecretString: 'fakeSecretPropertyValueVersionId'
      })

      const secretPropertyValue = await secretsManagerBackend._get({
        key: 'fakeSecretKey',
        specOptions,
        keyOptions: {
          versionId: 'ea9ef8d7-ea54-4a3b-b24b-99510e8d7a3d'
        }
      })

      expect(clientMock.getSecretValue.calledWith({
        SecretId: 'fakeSecretKey',
        VersionId: 'ea9ef8d7-ea54-4a3b-b24b-99510e8d7a3d'
      })).to.equal(true)
      expect(clientFactoryMock.getCall(0).args).deep.equals([])
      expect(assumeRoleMock.callCount).equals(0)
      expect(secretPropertyValue).equals('fakeSecretPropertyValueVersionId')
    })
  })
})
