'use strict'

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

module.exports = {
  gcpSecretManager: () => {

	// use the service account json file for authentication & authorization
	// TODO: how to bootstrap 
  	const options = {
		keyFilename: 'key-name-can-come-from-env',
	}

    const gcpClient = new SecretManagerServiceClient(options);
    return gcpClient
  }
}