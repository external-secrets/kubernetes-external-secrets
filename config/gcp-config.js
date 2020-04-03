'use strict'

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

// First, ADC checks to see if the environment variable GOOGLE_APPLICATION_CREDENTIALS is set.
// If the variable is set, ADC uses the service account file that the variable points to
// If the environment variable isn't set, ADC uses the default service account that the Kubernetes Engine
// provides, for applications that run on those services

module.exports = {
  gcpSecretsManager: () => {
    const client = new SecretManagerServiceClient()
    return client
  }
}
