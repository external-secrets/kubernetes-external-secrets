/* eslint-disable no-sync, no-console */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function basenameGrouping(input) {
  const data = input.data;
  const grouped = Object.keys(data).reduce((awsSecrets, name) => {
    const base = name.split('.').slice(0, -1).join('.');
    if (!(base in awsSecrets)) {
      awsSecrets[base] = [];
    }
    awsSecrets[base].push({ [name]: Buffer.from(data[name], 'base64').toString() });
    return awsSecrets;
  }, {});
  return grouped;
}

function singleValue(input) {
  const data = input.data;
  return Object.keys(data).reduce((awsSecrets, name) => {
    awsSecrets[name] = [{ [name]: Buffer.from(data[name], 'base64').toString() }];
    return awsSecrets;
  }, {});
}

const argv = require('yargs')
  .option('input', {
    describe: 'Input Secret manifest file',
    demand: true
  })
  .option('output', {
    describe: 'Directory to store results',
    demand: true
  })
  .option('aws-sm-output', {
    describe: 'Output format for AWS Secret Manager secrets',
    choices: ['single-value', 'basename-key-values'],
    default: 'basename-key-values'
  })
  .option('name-prefix', {
    describe: 'AWS Secret name prefix (e.g., "simple-service/")'
  })
  .help()
  .argv;

function main(args) {
  const input = yaml.safeLoad((fs.readFileSync(args.input).toString()));
  const awsSecrets = {
    'single-value': singleValue,
    'basename-key-values': basenameGrouping
  }[args['aws-sm-output']](input);

  //
  // Make AWS Secret Manager entries.
  //
  const properties = [];
  Object.keys(awsSecrets).forEach(awsSecretName => {
    const keyValues = awsSecrets[awsSecretName];

    if (keyValues.length > 1) {
      const key = [args.namePrefix, awsSecretName].filter(Boolean).join('');
      keyValues.forEach(keyValue => {
        const name = Object.keys(keyValue)[0];
        const externalSecretProperty = {
          key,
          name: name,
          property: name
        };
        properties.push(externalSecretProperty);
      });
      const secretManagerKeyValues = Object.assign({}, ...keyValues);
      const outputFile = path.join(args.output, `${awsSecretName}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(secretManagerKeyValues));
      console.log(`aws secretsmanager create-secret --name ${key} --secret-string file://${outputFile}`);
    } else {
      const name = Object.keys(keyValues[0])[0];
      const key = [args.namePrefix, name].filter(Boolean).join('');
      properties.push({
        key,
        name
      });
      const outputFile = path.join(args.output, `${awsSecretName}.json`);
      fs.writeFileSync(outputFile, keyValues[0][name]);
      console.log(`aws secretsmanager create-secret --name ${key} --secret-string file://${outputFile}`);
    }
  });

  //
  // Make the ExternalSecret.
  //
  const externalSecretManifest = yaml.safeDump({
    apiVersion: 'kubernetes-client.io/v1',
    kind: 'ExternalSecret',
    metadata: {
      name: input.metadata.name,
      namespace: input.metadata.namespace
    },
    secretDescriptor: {
      backendType: 'secretManager',
      properties
    }
  });
  const outputFile = path.join(args.output, 'external-secret.yaml');
  fs.writeFileSync(outputFile, externalSecretManifest);
  console.log(`kubectl apply -f ${outputFile}`);
}

main(argv);
