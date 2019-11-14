/* eslint-env mocha */
'use strict'

const util = require('util')
const { expect } = require('chai')

const {
  kubeClient,
  customResourceManifest,
  awsConfig
} = require('../../config')
const {
  waitForSecret,
  uuid,
  delay
} = require('./framework.js')

const secretsmanager = awsConfig.secretsManagerFactory()
const createSecret = util.promisify(secretsmanager.createSecret).bind(secretsmanager)
const putSecretValue = util.promisify(secretsmanager.putSecretValue).bind(secretsmanager)

describe('secretsmanager', async () => {
  it('should pull existing secret from secretsmanager and create a secret with its values', async () => {
    let result = await createSecret({
      Name: `e2e/${uuid}/credentials`,
      SecretString: '{"username":"foo","password":"bar"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({ body: {
        apiVersion: 'kubernetes-client.io/v1',
        kind: 'ExternalSecret',
        metadata: {
          name: `e2e-secretmanager-${uuid}`
        },
        spec: {
          backendType: 'secretsManager',
          data: [
            {
              key: `e2e/${uuid}/credentials`,
              property: 'password',
              name: 'password'
            },
            {
              key: `e2e/${uuid}/credentials`,
              property: 'username',
              name: 'username'
            }
          ]
        }
      } })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    let secret = await waitForSecret('default', `e2e-secretmanager-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data.username).to.equal('Zm9v')
    expect(secret.body.data.password).to.equal('YmFy')

    // update the secret value
    result = await putSecretValue({
      SecretId: `e2e/${uuid}/credentials`,
      SecretString: '{"username":"your mom","password":"1234"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })
    await delay(2000)
    secret = await waitForSecret('default', `e2e-secretmanager-${uuid}`)
    expect(secret.body.data.username).to.equal('eW91ciBtb20=')
    expect(secret.body.data.password).to.equal('MTIzNA==')
  })

  it('should pull TLS secret from secretsmanager', async () => {
    let result = await createSecret({
      Name: `e2e/${uuid}/tls/cert`,
      SecretString: '{"crt":"foo","key":"bar"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({ body: {
        apiVersion: 'kubernetes-client.io/v1',
        kind: 'ExternalSecret',
        metadata: {
          name: `e2e-secretmanager-tls-${uuid}`
        },
        spec: {
          backendType: 'secretsManager',
          type: 'kubernetes.io/tls',
          data: [
            {
              key: `e2e/${uuid}/tls/cert`,
              property: 'crt',
              name: 'tls.crt'
            },
            {
              key: `e2e/${uuid}/tls/cert`,
              property: 'key',
              name: 'tls.key'
            }
          ]
        }
      } })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    const secret = await waitForSecret('default', `e2e-secretmanager-tls-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data['tls.crt']).to.equal('Zm9v')
    expect(secret.body.data['tls.key']).to.equal('YmFy')
    expect(secret.body.type).to.equal('kubernetes.io/tls')
  })

  describe('permitted annotation', async () => {
    beforeEach(async () => {
      await kubeClient.api.v1.namespaces('default').patch({
        body: {
          metadata: {
            annotations: {
              'iam.amazonaws.com/permitted': '^(foo|bar)'
            }
          }
        }
      })
    })

    afterEach(async () => {
      await kubeClient.api.v1.namespaces('default').patch({
        body: {
          metadata: {
            annotations: {
              'iam.amazonaws.com/permitted': '.*'
            }
          }
        }
      })
    })

    it('should not pull from secretsmanager', async () => {
      let result = await createSecret({
        Name: `e2e/${uuid}/tls/permitted`,
        SecretString: '{"crt":"foo","key":"bar"}'
      }).catch(err => {
        expect(err).to.equal(null)
      })

      result = await kubeClient
        .apis[customResourceManifest.spec.group]
        .v1.namespaces('default')[customResourceManifest.spec.names.plural]
        .post({ body: {
          apiVersion: 'kubernetes-client.io/v1',
          kind: 'ExternalSecret',
          metadata: {
            name: `e2e-secretmanager-permitted-tls-${uuid}`
          },
          spec: {
            backendType: 'secretsManager',
            type: 'kubernetes.io/tls',
            // this should not be allowed
            roleArn: 'let-me-be-root',
            data: [
              {
                key: `e2e/${uuid}/tls/permitted`,
                property: 'crt',
                name: 'tls.crt'
              },
              {
                key: `e2e/${uuid}/tls/permitted`,
                property: 'key',
                name: 'tls.key'
              }
            ]
          }
        } })

      expect(result).to.not.equal(undefined)
      expect(result.statusCode).to.equal(201)

      const secret = await waitForSecret('default', `e2e-secretmanager-permitted-tls-${uuid}`)
      expect(secret).to.equal(undefined)

      result = await kubeClient
        .apis[customResourceManifest.spec.group]
        .v1.namespaces('default')
        .externalsecrets(`e2e-secretmanager-permitted-tls-${uuid}`)
        .get()
      expect(result).to.not.equal(undefined)
      expect(result.body.status.status).to.contain('namspace does not allow to assume role let-me-be-root')
    })
  })
})
