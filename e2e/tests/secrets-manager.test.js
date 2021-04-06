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
      .post({
        body: {
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
        }
      })

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

  it('should pull existing secret from secretsmanager and create a secret using templating', async () => {
    let result = await createSecret({
      Name: `e2e/${uuid}/template`,
      SecretString: '{"secretData":"foo123"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({
        body: {
          apiVersion: 'kubernetes-client.io/v1',
          kind: 'ExternalSecret',
          metadata: {
            name: `e2e-secretmanager-template-${uuid}`
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  secretLabel: '<%= "Hello".concat(data.secretData) %>'
                }
              }
            },
            backendType: 'secretsManager',
            data: [
              {
                key: `e2e/${uuid}/template`,
                property: 'secretData',
                name: 'secretData'
              }
            ]
          }
        }
      })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    const secret = await waitForSecret('default', `e2e-secretmanager-template-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data.secretData).to.equal('Zm9vMTIz') // foo123 is base64 Zm9vMTIz
    expect(secret.body.metadata.labels.secretLabel).to.equal('Hellofoo123')
  })

  it('should pull TLS secret from secretsmanager - type', async () => {
    let result = await createSecret({
      Name: `e2e/${uuid}/tls/cert`,
      SecretString: '{"crt":"foo","key":"bar"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({
        body: {
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
        }
      })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    const secret = await waitForSecret('default', `e2e-secretmanager-tls-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data['tls.crt']).to.equal('Zm9v')
    expect(secret.body.data['tls.key']).to.equal('YmFy')
    expect(secret.body.type).to.equal('kubernetes.io/tls')
  })

  it('should pull TLS secret from secretsmanager - template', async () => {
    let result = await createSecret({
      Name: `e2e/${uuid}/tls/cert-template`,
      SecretString: '{"crt":"foo","key":"bar"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({
        body: {
          apiVersion: 'kubernetes-client.io/v1',
          kind: 'ExternalSecret',
          metadata: {
            name: `e2e-secretmanager-tls-template-${uuid}`
          },
          spec: {
            backendType: 'secretsManager',
            template: {
              type: 'kubernetes.io/tls'
            },
            data: [
              {
                key: `e2e/${uuid}/tls/cert-template`,
                property: 'crt',
                name: 'tls.crt'
              },
              {
                key: `e2e/${uuid}/tls/cert-template`,
                property: 'key',
                name: 'tls.key'
              }
            ]
          }
        }
      })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    const secret = await waitForSecret('default', `e2e-secretmanager-tls-template-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data['tls.crt']).to.equal('Zm9v')
    expect(secret.body.data['tls.key']).to.equal('YmFy')
    expect(secret.body.type).to.equal('kubernetes.io/tls')
  })

  it('should pull existing secret from secretsmanager in the correct region', async () => {
    const smEU = awsConfig.secretsManagerFactory({
      region: 'eu-west-1'
    })
    const createSecret = util.promisify(smEU.createSecret).bind(smEU)
    const putSecretValue = util.promisify(smEU.putSecretValue).bind(smEU)

    let result = await createSecret({
      Name: `e2e/${uuid}/x-region-credentials`,
      SecretString: '{"username":"foo","password":"bar"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    result = await kubeClient
      .apis[customResourceManifest.spec.group]
      .v1.namespaces('default')[customResourceManifest.spec.names.plural]
      .post({
        body: {
          apiVersion: 'kubernetes-client.io/v1',
          kind: 'ExternalSecret',
          metadata: {
            name: `e2e-secretmanager-x-region-${uuid}`
          },
          spec: {
            backendType: 'secretsManager',
            region: 'eu-west-1',
            data: [
              {
                key: `e2e/${uuid}/x-region-credentials`,
                property: 'password',
                name: 'password'
              },
              {
                key: `e2e/${uuid}/x-region-credentials`,
                property: 'username',
                name: 'username'
              }
            ]
          }
        }
      })

    expect(result).to.not.equal(undefined)
    expect(result.statusCode).to.equal(201)

    let secret = await waitForSecret('default', `e2e-secretmanager-x-region-${uuid}`)
    expect(secret).to.not.equal(undefined)
    expect(secret.body.data.username).to.equal('Zm9v')
    expect(secret.body.data.password).to.equal('YmFy')

    // update the secret value
    result = await putSecretValue({
      SecretId: `e2e/${uuid}/x-region-credentials`,
      SecretString: '{"username":"your mom","password":"1234"}'
    }).catch(err => {
      expect(err).to.equal(null)
    })
    await delay(2000)
    secret = await waitForSecret('default', `e2e-secretmanager-x-region-${uuid}`)
    expect(secret.body.data.username).to.equal('eW91ciBtb20=')
    expect(secret.body.data.password).to.equal('MTIzNA==')
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
              'iam.amazonaws.com/permitted': '.*',
              'externalsecrets.kubernetes-client.io/permitted-key-name': '.*'
            }
          }
        }
      })
    })

    describe('assuming role', async () => {
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
          .post({
            body: {
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
            }
          })

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
        expect(result.body.status.status).to.contain('namespace does not allow to assume role let-me-be-root')
      })
    })

    describe('enforcing naming convention', async () => {
      it('should not pull from secretsmanager', async () => {
        await kubeClient.api.v1.namespaces('default').patch({
          body: {
            metadata: {
              annotations: {
                'iam.amazonaws.com/permitted': '.*',
                'externalsecrets.kubernetes-client.io/permitted-key-name': '/permitted/path/.*'
              }
            }
          }
        })

        let result = await createSecret({
          Name: `e2e/${uuid}/another_credentials`,
          SecretString: '{"username":"foo","password":"bar"}'
        }).catch(err => {
          expect(err).to.equal(null)
        })

        result = await kubeClient
          .apis[customResourceManifest.spec.group]
          .v1.namespaces('default')[customResourceManifest.spec.names.plural]
          .post({
            body: {
              apiVersion: 'kubernetes-client.io/v1',
              kind: 'ExternalSecret',
              metadata: {
                name: `e2e-secretmanager-permitted-key-${uuid}`
              },
              spec: {
                backendType: 'secretsManager',
                data: [
                  {
                    key: `e2e/${uuid}/another_credentials`,
                    property: 'password',
                    name: 'password'
                  },
                  {
                    key: `e2e/${uuid}/another_credentials`,
                    property: 'username',
                    name: 'username'
                  }
                ]
              }
            }
          })

        expect(result).to.not.equal(undefined)
        expect(result.statusCode).to.equal(201)

        const secret = await waitForSecret('default', `e2e-secretmanager-permitted-key-${uuid}`)
        expect(secret).to.equal(undefined)

        result = await kubeClient
          .apis[customResourceManifest.spec.group]
          .v1.namespaces('default')
          .externalsecrets(`e2e-secretmanager-permitted-key-${uuid}`)
          .get()
        expect(result).to.not.equal(undefined)
        expect(result.body.status.status).to.contain(`key name e2e/${uuid}/another_credentials does not match naming convention /permitted/path/.*`)
      })
    })
  })
})
