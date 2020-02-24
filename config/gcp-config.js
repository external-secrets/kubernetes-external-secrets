'use strict'

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

module.exports = {
  gcpSecretManager: () => {

	// Reads the secret object with the json file and creates the option object
	// only sa email address and private key are needed, project id is for fetching 
	// secret
	const serviceAccountDetails = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
	const options = {
		credentials : {
			client_email: serviceAccountDetails.client_email,
			private_key: serviceAccountDetails.private_key
		},
		projectId: serviceAccountDetails.project_id
	}

	const gcpClient = new SecretManagerServiceClient(options);
	return gcpClient
  }
}