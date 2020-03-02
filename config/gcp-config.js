'use strict'

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

module.exports = {
  gcpSecretManager: () => {
  	// Reads the environment variable GOOGLE_APPLICATION_CREDENTIALS to load the service
  	// account credentials
	const gcpClient = new SecretManagerServiceClient();
	return gcpClient
  }
}