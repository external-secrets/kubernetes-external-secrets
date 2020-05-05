[![Join Slack](https://img.shields.io/badge/Join%20us%20on-Slack-e01563.svg)](https://godaddy-oss-slack.herokuapp.com/)

# Kubernetes External Secrets

Kubernetes External Secrets allows you to use external secret
management systems, like [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) or
[HashiCorp Vault](https://www.vaultproject.io/), to securely add secrets in
Kubernetes. Read more about the design and motivation for Kubernetes
External Secrets on the [GoDaddy Engineering
Blog](https://godaddy.github.io/2019/04/16/kubernetes-external-secrets/).

## How it works

The project extends the Kubernetes API by adding a `ExternalSecrets` object using [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and a controller to implement the behavior of the object itself.

An `ExternalSecret` declares how to fetch the secret data, while the controller converts all `ExternalSecrets` to `Secrets`.
The conversion is completely transparent to `Pods` that can access `Secrets` normally.

## System architecture

![Architecture](architecture.png)

1. `ExternalSecrets` are added in the cluster (e.g., `kubectl apply -f external-secret-example.yml`)
1. Controller fetches `ExternalSecrets` using the Kubernetes API
1. Controller uses `ExternalSecrets` to fetch secret data from external providers (e.g, AWS Secrets Manager)
1. Controller upsert `Secrets`
1. `Pods` can access `Secrets` normally

## How to use it

### Install with Helm

The official [helm chart](charts/kubernetes-external-secrets) can be used to create the `kubernetes-external-secrets` resources and `Deployment` on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.


```bash
$ helm repo add external-secrets https://godaddy.github.io/kubernetes-external-secrets/
$ helm install external-secrets/kubernetes-external-secrets
```

For more details about configuration see the [helm chart docs](charts/kubernetes-external-secrets/README.md)

### Install with kubectl

If you don't want to install helm on your cluster and just want to use `kubectl` to install `kubernetes-external-secrets`, you could get the `helm` client cli first and then use the following sample command to generate kubernetes manifests:

```bash
$ helm template -f charts/kubernetes-external-secrets/values.yaml --output-dir ./output_dir ./charts/kubernetes-external-secrets/
```

The generated kubernetes manifests will be in `./output_dir` and can be applied to deploy `kubernetes-external-secrets` to the cluster.

### Secrets Manager access

For `kubernetes-external-secrets` to be able to retrieve your secrets it will need access to your secret backend.

#### AWS based backends

Access to AWS secrets backends (SSM & secrets manager) can be granted in various ways:

1. Granting your nodes explicit access to your secrets using the [node instance role](https://docs.aws.amazon.com/eks/latest/userguide/worker_node_IAM_role.html) (easy for experimentation, not recommended)

2. [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html).

3. Per pod IAM authentication: [kiam](https://github.com/uswitch/kiam) or [kube2iam](https://github.com/jtblin/kube2iam).

4. Directly provide AWS access credentials to the `kubernetes-external-secrets` pod by environmental variables.

##### Using AWS access credentials

Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars in the `kubernetes-external-secrets` session/pod.
You can use envVarsFromSecret in the helm chart to create these env vars from existing k8s secrets.

Additionally, you can specify a `roleArn` which will be assumed before retrieving the secret.
You can limit the range of roles which can be assumed by this particular *namespace* by using annotations on the namespace resource. The annotation key is configurable (see above). The annotation value is evaluated as a regular expression and tries to match the `roleArn`.

```yaml
kind: Namespace
metadata:
  name: iam-example
  annotations:
    # annotation key is configurable
    iam.amazonaws.com/permitted: "arn:aws:iam::123456789012:role/.*"
```

### Add a secret

Add your secret data to your backend. For example, AWS Secrets Manager:

```
aws secretsmanager create-secret --name hello-service/password --secret-string "1234"
```

AWS Parameter Store:

```
aws ssm put-parameter --name "/hello-service/password" --type "String" --value "1234"
```

and then create a `hello-service-external-secret.yml` file:

```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: secretsManager
  # optional: specify role to assume when retrieving the data
  roleArn: arn:aws:iam::123456789012:role/test-role
  data:
    - key: hello-service/password
      name: password
  # optional: specify a template with any additional markup you would like added to the downstream Secret resource.
  # This template will be deep merged without mutating any existing fields. For example: you cannot override metadata.name.
  template:
    metadata:
      annotations:
        cat: cheese
      labels:
        dog: farfel
```
or
```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: systemManager
  data:
    - key: /hello-service/password
      name: password
```

The following IAM policy allows a user or role to access parameters matching `prod-*`.
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:GetParameter",
      "Resource": "arn:aws:ssm:us-west-2:123456789012:parameter/prod-*"
    }
  ]
}
```

The IAM policy for Secrets Manager is similar ([see docs](https://docs.aws.amazon.com/mediaconnect/latest/ug/iam-policy-examples-asm-secrets.html)):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetResourcePolicy",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-west-2:111122223333:secret:aes128-1a2b3c",
        "arn:aws:secretsmanager:us-west-2:111122223333:secret:aes192-4D5e6F",
        "arn:aws:secretsmanager:us-west-2:111122223333:secret:aes256-7g8H9i"
      ]
    }
  ]
}
```

Save the file and run:

```sh
kubectl apply -f hello-service-external-secret.yml
```

Wait a few minutes and verify that the associated `Secret` has been created:

```sh
kubectl get secret hello-service -o=yaml
```

The `Secret` created by the controller should look like:

```yml
apiVersion: v1
kind: Secret
metadata:
  name: hello-service
  annotations:
    cat: cheese
  labels:
    dog: farfel
type: Opaque
data:
  password: MTIzNA==
```

## Enforcing naming conventions for backend keys

by default an `ExternalSecret` may access arbitrary keys from the backend e.g.

```yml
  data:
    - key: /dev/cluster1/core-namespace/hello-service/password
      name: password
```

An enforced naming convention helps to keep the structure tidy and limits the access according 
to your naming schema. 

Configure the schema as regular expression in the namespace using an annotation. 
This allows `ExternalSecrets` in `core-namespace` just to access secrets that start with 
`/dev/cluster1/core-namespace/`:

```yaml
kind: Namespace
metadata:
  name: core-namespace
  annotations:
    # annotation key is configurable
    externalsecrets.kubernetes-client.io/permitted-key-name: "/dev/cluster1/core-namespace/.*"
```

## Deprecations

A few properties has changed name overtime, we still maintain backwards compatbility with these but they will eventually be removed, and they are not validated using the CRD validation.

| Old                           | New                            |
| ----------------------------- | ------------------------------ |
| `secretDescriptor`            | `spec`                         |
| `spec.type`                   | `spec.template.type`           |
| `spec.properties`             | `spec.data`                    |
| `backendType: secretManager`  | `backendType: secretsManager`  |

## Backends

kubernetes-external-secrets supports AWS Secrets Manager, AWS System Manager, Hashicorp Vault,  Azure Key Vault and Google Secret Manager.

### AWS Secrets Manager

kubernetes-external-secrets supports both JSON objects ("Secret
key/value" in the AWS console) or strings ("Plaintext" in the AWS
console). Using JSON objects is useful when you need to atomically
update multiple values. For example, when rotating a client
certificate and private key.

When writing an ExternalSecret for a JSON object you must specify the
properties to use. For example, if we add our hello-service
credentials as a single JSON object:

```
aws secretsmanager create-secret --region us-west-2 --name hello-service/credentials --secret-string '{"username":"admin","password":"1234"}'
```

We can declare which properties we want from hello-service/credentials:

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: secretsManager
  # optional: specify role to assume when retrieving the data
  roleArn: arn:aws:iam::123456789012:role/test-role
  data:
    - key: hello-service/credentials
      name: password
      property: password
    - key: hello-service/credentials
      name: username
      property: username
    - key: hello-service/credentials
      name: password
      # Version Stage in Secrets Manager
      versionStage: AWSPREVIOUS
      property: password_previous
```

alternatively you can use `dataFrom` and get all the values from hello-service/credentials:

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: secretsManager
  # optional: specify role to assume when retrieving the data
  roleArn: arn:aws:iam::123456789012:role/test-role
  dataFrom:
    - hello-service/credentials
```

`data` and `dataFrom` can of course be combined, any naming conflicts will use the last defined, with `data` overriding `dataFrom`

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: secretsManager
  # optional: specify role to assume when retrieving the data
  roleArn: arn:aws:iam::123456789012:role/test-role
  dataFrom:
    - hello-service/credentials
  data:
    - key: hello-service/migration-credentials
      name: password
      property: password
```

### Hashicorp Vault

kubernetes-external-secrets supports fetching secrets from [Hashicorp Vault](https://www.vaultproject.io/), using the [Kubernetes authentication method](https://www.vaultproject.io/docs/auth/kubernetes).

You will need to set the `VAULT_ADDR` environment variables so that kubernetes-external-secrets knows which endpoint to connect to, then create `ExternalSecret` definitions as follows:

```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: hello-vault-service
spec:
  backendType: vault
  # Your authentication mount point, e.g. "kubernetes"
  vaultMountPoint: my-kubernetes-vault-mount-point
  # The vault role that will be used to fetch the secrets
  # This role will need to be bound to kubernetes-external-secret's ServiceAccount; see Vault's documentation:
  # https://www.vaultproject.io/docs/auth/kubernetes.html
  vaultRole: my-vault-role
  data:
  - name: password
    # The full path of the secret to read, as in `vault read secret/data/hello-service/credentials`
    key: secret/data/hello-service/credentials
    property: password
  # Vault values are matched individually. If you have several keys in your Vault secret, you will need to add them all separately
  - name: api-key
    key: secret/data/hello-service/credentials
    property: api-key
```

If Vault uses a certificate issued by a self-signed CA you will need to provide that certificate:

```sh
# Create secret with CA
kubectl create secret generic vault-ca --from-file=./ca.pem
```

```yml
# values.yaml
env:
  VAULT_ADDR: https://vault.domain.tld
  NODE_EXTRA_CA_CERTS: "/usr/local/share/ca-certificates/ca.pem"

filesFromSecret:
  certificate-authority:
    secret: vault-ca
    mountPath: /usr/local/share/ca-certificates
 ```

### Azure Key Vault

kubernetes-external-secrets supports fetching secrets from [Azure Key vault](https://azure.microsoft.com/en-ca/services/key-vault/)

You will need to set these env vars in the deployment of kubernetes-external-secrets:
- AZURE_TENANT_ID
- AZURE_CLIENT_ID
- AZURE_CLIENT_SECRET

The SP configured will require get and list access policies on the AZURE_KEYVAULT_NAME.

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-keyvault-service
spec:
  backendType: azureKeyVault
  keyVaultName: hello-world
  data:
    - key: hello-service/credentials
      name: password
      property: value
```

Due to the way Azure handles binary files, you need to explicitly let the ExternalSecret know that the secret is binary.
You can do that with the `isBinary` field on the key. This is necessary for certificates and other secret binary files.

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-keyvault-service
spec:
  backendType: azureKeyVault
  keyVaultName: hello-world
  data:
    - key: hello-service/credentials
      name: password
      isBinary: true
```

### GCP Secret Manager

kubernetes-external-secrets supports fetching secrets from [GCP Secret Manager](https://cloud.google.com/solutions/secrets-management)

The external secret will poll for changes to the secret according to the value set for POLLER_INTERVAL_MILLISECONDS in env.  Depending on the time interval this is set to you may incur additional charges as Google Secret Manager [charges](https://cloud.google.com/secret-manager/pricing) per a set number of API calls.

A service account is required to grant the controller access to pull secrets. 

#### Workload Identity

Instructions are here: [Enable Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity#enable_workload_identity_on_a_new_cluster).  To enable workload identity on an existing cluster (which is not covered in that document), first enable it on the cluster like so:

    gcloud container clusters update $CLUSTER_NAME --workload-pool=$PROJECT_NAME.svc.id.goog
    
Next enable workload metadata config on the node pool in which the pod will run:

    gcloud beta container node-pools update $POOL --cluster $CLUSTER_NAME --workload-metadata-from-node=GKE_METADATA_SERVER

If enabling it only for a particular pool, make sure to add any relevant tolerations or affinities:

    tolerations:
      - key: "name"
        operator: "Equal"
        effect: "NoExecute"
        value: "node-pool-taint"
      - key: "name"
        operator: "Equal"
        effect: "NoSchedule"
        value: "node-pool-taint"
    
    affinity:
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
            - matchExpressions:
                - key: cloud.google.com/gke-nodepool
                  operator: In
                  values:
                    - node-pool
    
You can add an annotation which is needed for workload identity by passing it in via Helm:

    serviceAccount:
      annotations: 
        iam.gke.io/gcp-service-account: my-secrets-sa@$PROJECT.iam.gserviceaccount.com

Create the policy binding:

    gcloud iam service-accounts add-iam-policy-binding --role roles/iam.workloadIdentityUser --member "serviceAccount:$CLUSTER_PROJECT.svc.id.goog[$SECRETS_NAMESPACE/kubernetes-external-secrets]" my-secrets-sa@$PROJECT.iam.gserviceaccount.com

#### Loading from a Service Account Key

Alternatively you can create and mount a kubernetes secret containing google service account credentials and set the GOOGLE_APPLICATION_CREDENTIALS env variable.

Create a Kubernetes secret called gcp-creds with a JSON keyfile from a service account with necessary credentials to access the secrets:

    apiVersion: v1
    kind: Secret
    metadata:
      name: mysecret
    type: Opaque
    stringData:
      gcp-creds.json: |-
        $KEYFILE_CONTENT

Uncomment GOOGLE_APPLICATION_CREDENTIALS in the values file as well as the following section:

    env:
      AWS_REGION: us-west-2
      POLLER_INTERVAL_MILLISECONDS: 10000  # Caution, setting this frequency may incur additional charges on some platforms
      LOG_LEVEL: info
      METRICS_PORT: 3001
      VAULT_ADDR: http://127.0.0.1:8200
      GOOGLE_APPLICATION_CREDENTIALS: /app/gcp-creds/gcp-creds.json

     filesFromSecret:
       gcp-creds:
         secret: gcp-creds
         mountPath: /app/gcp-creds
         
This will mount the secret at /app/gcp-creds/gcp-creds.json and make it available via the GOOGLE_APPLICATION_CREDENTIALS environment variable.

Once you have this installed, you can create an external secret with YAML like the following:

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: gcp-secrets-manager-example
spec:
  backendType: gcpSecretsManager
  projectId: my-gsm-secret-project
  data:
    - key: my-gsm-secret-name
      name: my-kubernetes-secret-name
      version: latest
      property: value
```

The field "key" is the name of the secret in Google Secret Manager.  The field "name" is the name of the Kubernetes secret this external secret will generate.  The metadata "name" field is the name of the external secret in Kubernetes.

To retrieve external secrets, you can use the following command:

    kubectl get externalsecrets -n $NAMESPACE
    
To retrieve the secrets themselves, you can use the regular:

    kubectl get secrets -n $NAMESPACE
    
To retrieve an individual secret's content, use the following where "mysecret" is the key to the secret content under the "data" field:

    kubectl get secret my-secret -o 'go-template={{index .data "mysecret"}}' | base64 -D

The secrets will persist even if the helm installation is removed, although they will no longer sync to Google Secret Manager.

## Metrics

kubernetes-external-secrets exposes the following metrics over a prometheus endpoint:

| Metric                                    | Description                                                                     | Example                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `sync_calls`                              | This metric counts the number of sync calls by backend, secret name and status  | `sync_calls{name="foo",namespace="example",backend="foo",status="success"} 1` |
| `last_state`                              | A value of -1 or 1 where -1 means the last sync_call was an error and 1 means the last sync_call was a success  | `last_state{name="foo",namespace="example",backend="foo"} 1` |


## Development

[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a tool that makes it easy to run a Kubernetes cluster locally.

Start minikube and the daemon. This creates the `CustomerResourceDefinition`, and starts to process `ExternalSecrets`:

```sh
minikube start

npm run nodemon
```

### Development with localstack

[Localstack](https://github.com/localstack/localstack) mocks AWS services locally so you can test without connecting to AWS.

Run localstack in a seperate terminal window

```sh
npm run localstack
```

Start minikube as above

```sh
minikube start
```

Run the daemon with localstack

```sh
npm run local
```

Add secrets using the AWS cli (example)

```sh
AWS_ACCESS_KEY_ID=foobar AWS_SECRET_ACCESS_KEY=foobar aws --region=us-west-2 --endpoint-url=http://localhost:4584 secretsmanager create-secret --name hello-service/password --secret-string "1234"
```