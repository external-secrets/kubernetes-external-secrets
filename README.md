[![LGTM Alerts](https://img.shields.io/lgtm/alerts/github/external-secrets/kubernetes-external-secrets)](https://lgtm.com/projects/g/external-secrets/kubernetes-external-secrets)

## Repository moved to external-secrets

This project was moved from the [GoDaddy](https://github.com/godaddy) to the [external-secrets](https://github.com/external-secrets/kubernetes-external-secrets) GitHub organization in an effort to consolidate different projects with the same objective. More information [here](https://github.com/external-secrets/kubernetes-external-secrets/issues/554#issuecomment-728984416).

# Kubernetes External Secrets

Kubernetes External Secrets allows you to use external secret
management systems, like [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) or
[HashiCorp Vault](https://www.vaultproject.io/), to securely add secrets in
Kubernetes. Read more about the design and motivation for Kubernetes
External Secrets on the [GoDaddy Engineering
Blog](https://godaddy.github.io/2019/04/16/kubernetes-external-secrets/).

The community and maintainers of this project and related Kubernetes
secret management projects use
[`#external-secrets`](https://kubernetes.slack.com/archives/C017BF84G2Y)
channel on the Kubernetes slack for discussion and brainstorming.

## How it works

The project extends the Kubernetes API by adding a `ExternalSecrets` object using [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and a controller to implement the behavior of the object itself.

An `ExternalSecret` declares how to fetch the secret data, while the controller converts all `ExternalSecrets` to `Secrets`.
The conversion is completely transparent to `Pods` that can access `Secrets` normally.

By default `Secrets` are not encrypted at rest and are open to attack, either via the etcd server or via backups of etcd data.
To mitigate this risk, use an
[external secret management system with a KMS plugin](https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/)
to encrypt `Secrets` stored in etcd.

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
$ helm repo add external-secrets https://external-secrets.github.io/kubernetes-external-secrets/
$ helm install external-secrets/kubernetes-external-secrets
```

For more details about configuration see the [helm chart docs](charts/kubernetes-external-secrets/README.md)

### Install with kubectl

If you don't want to install helm on your cluster and just want to use `kubectl` to install `kubernetes-external-secrets`, you could get the `helm` client cli first and then use the following sample command to generate kubernetes manifests:

```bash
$ helm template --output-dir ./output_dir ./charts/kubernetes-external-secrets/
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

5. Optionally configure custom endpoints using environment variables
   - [AWS_SM_ENDPOINT](https://docs.aws.amazon.com/general/latest/gr/asm.html) - Useful to set endpoints for FIPS compliance.
   - [AWS_STS_ENDPOINT](https://docs.aws.amazon.com/general/latest/gr/sts.html) - Useful to set endpoints for FIPS compliance or regional latency.
   - [AWS_SSM_ENDPOINT](https://docs.aws.amazon.com/general/latest/gr/ssm.html) - Useful to set endpoints for FIPS compliance or custom VPC endpoint.

##### Using AWS access credentials

Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars in the `kubernetes-external-secrets` session/pod.
You can use envVarsFromSecret in the helm chart to create these env vars from existing k8s secrets.

Additionally, you can specify a `roleArn` which will be assumed before retrieving the secret.
You can limit the range of roles which can be assumed by this particular _namespace_ by using annotations on the namespace resource. The annotation key is configurable (see above). The annotation value is evaluated as a regular expression and tries to match the `roleArn`.

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
apiVersion: "kubernetes-client.io/v1"
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
apiVersion: "kubernetes-client.io/v1"
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

### Create secrets of other types than opaque

You can override `ExternalSecret` type using `template`, for example:

```yaml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-docker
spec:
  backendType: systemManager
  template:
    type: kubernetes.io/dockerconfigjson
  data:
    - key: /hello-service/hello-docker
      name: .dockerconfigjson
```

### Templating

Kubernetes External Secrets supports templating in `ExternalSecret` using [lodash.template](https://lodash.com/docs/4.17.15#template).

Template is applied to all `ExternalSecret.template` section of manifest.
Data retrieved from secure backend is available via `data` variable.
Additonal object `yaml` of instance of [js-yaml](https://github.com/nodeca/js-yaml) is available in `lodash` templates.
It can be leveraged for easier YAML content manipulation.

Templating can be used for:

- Generating K8S `Secret` keys:
  - upserting plain text via `ExternalSecret.template.stringData`
  - upserting base64 encoded content `ExternalSecret.template.data`
- For creating dynamic labels, annotations and other fields available in K8S `Secret` object.

To demonstrate templating functionality let's assume the secure backend, e.g. Hashicorp Vaule, contains following data

<table>
<tr>
<th>kv/extsec/secret1</th>
<th>kv/extsec/secret2</th
</tr>
<tr>
<td>

```json
{
  "intKey": 11,
  "objKey": {
    "strKey": "hello world"
  }
}
```

</td>
<td>

```json
{
  "arrKey": [1, 2, 3]
}
```

</td>
</tr>
</table>

Then, one could create following `ExternalSecret`

```yaml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: tmpl-ext-sec
spec:
  backendType: vault
  data:
    - key: kv/data/extsec/secret1
      name: s1
    - key: kv/data/extsec/secret2
      name: s2
  kvVersion: 2
  template:
    data:
      file.txt: |
        <%= Buffer.from(JSON.stringify(JSON.parse(data.s1).objKey)).toString("base64") %>
    metadata:
      labels:
        label1: <%= JSON.parse(data.s1).intKey %>
        label2: <%= JSON.parse(data.s1).objKey.strKey.replace(" ", "-") %>
    stringData:
      file.yaml: |
        <%= yaml.dump(JSON.parse(data.s1)) %>
        <% let s2 = JSON.parse(data.s2) %><% s2.arrKey.forEach((e, i) => { %>arr_<%= i %>: <%= e %>
        <% }) %>`
  vaultMountPoint: kubernetes
  vaultRole: demo
```

After applying this `ExternalSecret` to K8S cluster, the operator will generate following `Secret`

```yaml
apiVersion: v1
data:
  file.txt: eyJzdHJLZXkiOiJoZWxsbyB3b3JsZCJ9
  file.yaml: aW50S2V5OiAxMQpvYmpLZXk6CiAgc3RyS2V5OiBoZWxsbyB3b3JsZAoKYXJyXzA6IDEKYXJyXzE6IDIKYXJyXzI6IDMKYAo=
  s1: eyJpbnRLZXkiOjExLCJvYmpLZXkiOnsic3RyS2V5IjoiaGVsbG8gd29ybGQifX0=
  s2: eyJhcnJLZXkiOlsxLDIsM119
kind: Secret
metadata:
  name: tmpl-ext-sec
  labels:
    label1: "11"
    label2: hello-world
type: Opaque
```

Resulting `Secret` could be inspected to see that result is generated by `lodash` templating engine

```bash
$ kubectl get secret/tmpl-ext-sec -ogo-template='{{ index .data "s1" | base64decode }}'
{"intKey":11,"objKey":{"strKey":"hello world"}}

$ kubectl get secret/tmpl-ext-sec -ogo-template='{{ index .data "s2" | base64decode }}'
{"arrKey":[1,2,3]}

$ kubectl get secret/tmpl-ext-sec -ogo-template='{{ index .data "file.txt" | base64decode }}'
{"strKey":"hello world"}

$ kubectl get secret/tmpl-ext-sec -ogo-template='{{ index .data "file.yaml" | base64decode }}'
intKey: 11
objKey:
  strKey: hello world

arr_0: 1
arr_1: 2
arr_2: 3

$ kubectl get secret/tmpl-ext-sec -ogo-template='{{ .metadata.labels }}'
map[label1:11 label2:hello-world]
```

## Scoping access

### Using Namespace annotation

Enforcing naming conventions for backend keys could be done by using namespace annotations.
By default an `ExternalSecret` may access arbitrary keys from the backend e.g.

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

### Using ExternalSecret controller config

ExternalSecret config allows scoping the access of kubernetes-external-secrets controller.
This allows to deploy multi kubernetes-external-secrets instances in the same cluster
and each instance can access a set of predefined namespaces.

To enable this option, set the env var in the controller side with a list of namespaces:

```yaml
env:
  WATCHED_NAMESPACES: "default,qa,dev"
```

## Deprecations

A few properties has changed name overtime, we still maintain backwards compatbility with these but they will eventually be removed, and they are not validated using the CRD validation.

| Old                          | New                           |
| ---------------------------- | ----------------------------- |
| `secretDescriptor`           | `spec`                        |
| `spec.type`                  | `spec.template.type`          |
| `spec.properties`            | `spec.data`                   |
| `backendType: secretManager` | `backendType: secretsManager` |

## Backends

kubernetes-external-secrets supports AWS Secrets Manager, AWS System Manager, Hashicorp Vault, Azure Key Vault, Google Secret Manager and Alibaba Cloud KMS Secret Manager.

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
  # optional: specify region
  region: us-east-1
  data:
    - key: hello-service/credentials
      name: password
      property: password
    - key: hello-service/credentials
      name: username
      property: username
    - key: hello-service/credentials
      name: password_previous
      # Version Stage in Secrets Manager
      versionStage: AWSPREVIOUS
      property: password
    - key: hello-service/credentials
      name: password_versioned
      # Version ID in Secrets Manager
      versionId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      property: password
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
  # optional: specify region
  region: us-east-1
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
  # optional: specify region
  region: us-east-1
  dataFrom:
    - hello-service/credentials
  data:
    - key: hello-service/migration-credentials
      name: password
      property: password
```

# AWS SSM Parameter Store

You can scrape values from SSM Parameter Store individually or by providing a path to fetch all keys inside.

Additionally you can also scrape all sub paths (child paths) if you need to. The default is not to scrape child paths

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: systemManager
  # optional: specify role to assume when retrieving the data
  roleArn: arn:aws:iam::123456789012:role/test-role
  # optional: specify region
  region: us-east-1
  data:
    - key: /foo/name
      name: fooName
    - path: /extra-people/
      recursive: false
```

### Hashicorp Vault

kubernetes-external-secrets supports fetching secrets from [Hashicorp Vault](https://www.vaultproject.io/), using the [Kubernetes authentication method](https://www.vaultproject.io/docs/auth/kubernetes).

```yml
env:
  VAULT_ADDR: https://vault.domain.tld
  DEFAULT_VAULT_MOUNT_POINT: "k8s-auth" # optional, default value to be used if not specified in the ExternalSecret
  DEFAULT_VAULT_ROLE: "k8s-auth-role" # optional, default value to be used if not specified in the ExternalSecret
```

You will need to set the `VAULT_ADDR` environment variables so that kubernetes-external-secrets knows which endpoint to connect to, then create `ExternalSecret` definitions as follows:

```yml
apiVersion: "kubernetes-client.io/v1"
kind: ExternalSecret
metadata:
  name: hello-vault-service
spec:
  backendType: vault
  # Your authentication mount point, e.g. "kubernetes"
  # Overrides cluster DEFAULT_VAULT_MOUNT_POINT
  vaultMountPoint: my-kubernetes-vault-mount-point
  # The vault role that will be used to fetch the secrets
  # This role will need to be bound to kubernetes-external-secret's ServiceAccount; see Vault's documentation:
  # https://www.vaultproject.io/docs/auth/kubernetes.html
  # Overrides cluster DEFAULT_VAULT_ROLE
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

If you use Vault Namespaces (a Vault Enterprise feature) you can set the namespace to interact with via the `VAULT_NAMESPACE` environment variable.

The Vault token obtained by Kubernetes authentication will be renewed as needed. By default the token will be renewed three poller intervals (POLLER_INTERVAL_MILLISECONDS) before the token TTL expires. The default should be acceptable in most cases but the token renew threshold can also be customized by setting the `VAULT_TOKEN_RENEW_THRESHOLD` environment variable. The token renew threshold value is specified in seconds and tokens with remaining TTL less than this number of seconds will be renewed. In order to minimize token renewal load on the Vault server it is suggested that Kubernetes auth tokens issued by Vault have a TTL of at least ten times the poller interval so that they are renewed less frequently. A longer token TTL results in a lower token renewal load on Vault.

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
```

### Alibaba Cloud KMS Secret Manager

kubernetes-external-secrets supports fetching secrets from [Alibaba Cloud KMS Secret Manager](https://www.alibabacloud.com/help/doc-detail/152001.htm)

create secret by using the [aliyun-cli](https://github.com/aliyun/aliyun-cli) command below:

```bash
# you need to configure aliyun-cli with a valid RAM user and proper permission
aliyun kms CreateSecret --SecretName my_secret --SecretData P@ssw0rd --VersionId 001
```

You will need to set these env vars in the deployment of kubernetes-external-secrets:

- ALICLOUD_ACCESS_KEY_ID
- ALICLOUD_ACCESS_KEY_SECRET
- ALICLOUD_ENDPOINT

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: alicloudSecretsManager
  # optional: specify role to assume using provided access key ID and access key secret when retrieving the data
  roleArn: acs:ram::{UID}:role/demo
  data:
    - key: hello-credentials1
      name: password
    - key: hello-credentials2
      name: username
      # Version Stage in Alibaba Cloud KMS Secrets Manager. Optional, default value is ACSCurrent
      versionStage: ACSCurrent
```

### GCP Secret Manager

kubernetes-external-secrets supports fetching secrets from [GCP Secret Manager](https://cloud.google.com/solutions/secrets-management)

The external secret will poll for changes to the secret according to the value set for POLLER_INTERVAL_MILLISECONDS in env. Depending on the time interval this is set to you may incur additional charges as Google Secret Manager [charges](https://cloud.google.com/secret-manager/pricing) per a set number of API calls.

A service account is required to grant the controller access to pull secrets.

#### Add a secret

Add your secret data to your backend using GCP SDK :

```
echo -n '{"value": "my-secret-value"}' |     gcloud secrets create my-gsm-secret-name     --replication-policy="automatic"     --data-file=-
```

If the secret needs to be updated :

```
echo -n '{"value": "my-secret-value-with-update"}' |     gcloud secrets versions add my-gsm-secret-name --data-file=-
```

##### Deploy kubernetes-external-secrets using Workload Identity

Instructions are here: [Enable Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity#enable_workload_identity_on_a_new_cluster). To enable workload identity on an existing cluster (which is not covered in that document), first enable it on the cluster like so:

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

##### Deploy kubernetes-external-secrets using a service account key

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

#### Usage

Once you have kubernetes-external-secrets installed, you can create an external secret with YAML like the following:

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: gcp-secrets-manager-example # name of the k8s external secret and the k8s secret
spec:
  backendType: gcpSecretsManager
  projectId: my-gsm-secret-project
  data:
    - key: my-gsm-secret-name # name of the GCP secret
      name: my-kubernetes-secret-name # key name in the k8s secret
      version: latest # version of the GCP secret
      property: value # name of the field in the GCP secret
```

The field "key" is the name of the secret in Google Secret Manager. The field "name" is the name of the Kubernetes secret this external secret will generate. The metadata "name" field is the name of the external secret in Kubernetes.

To retrieve external secrets, you can use the following command:

    kubectl get externalsecrets -n $NAMESPACE

To retrieve the secrets themselves, you can use the regular:

    kubectl get secrets -n $NAMESPACE

To retrieve an individual secret's content, use the following where "mysecret" is the key to the secret content under the "data" field:

    kubectl get secret my-secret -o 'go-template={{index .data "mysecret"}}' | base64 -D

The secrets will persist even if the helm installation is removed, although they will no longer sync to Google Secret Manager.

## Binary Secrets

Most backends do not treat binary secrets any differently than text secrets. Since you typically store a binary secret as a base64-encoded string in the backend, you need to explicitly let the ExternalSecret know that the secret is binary, otherwise it will be encoded in base64 again.
You can do that with the `isBinary` field on the key. This is necessary for certificates and other secret binary files.

```yml
apiVersion: kubernetes-client.io/v1
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: anySupportedBackend
  # ...
  data:
    - key: hello-service/archives/secrets_zip
      name: secrets.zip
      isBinary: true # Default: false
    # also works with `property`
    - key: hello-service/certificates
      name: cert.p12
      property: cert.p12
      isBinary: true
```

AWS Secrets Manager is a notable exception to this. If you create/update a secret using [SecretBinary](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_CreateSecret.html#API_CreateSecret_RequestSyntax) parameter of the API, then AWS API will return the secret data as `SecretBinary` in the response and ExternalSecret will handle it accordingly. In that case, you do not need to use the `isBinary` field.

Note that `SecretBinary` parameter is not available when using the AWS Secrets Manager console. For any binary secrets (represented by a base64-encoded strings) created/updated via the AWS console, or stored in key-value pairs instead of text strings, you can just use the `isBinary` field explicitly as above.

## Metrics

kubernetes-external-secrets exposes the following metrics over a prometheus endpoint:

| Metric                                             | Type    | Description                                                                                                                             | Example                                                                                                         |
| -------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `kubernetes_external_secrets_sync_calls_count`     | Counter | Number of sync operations by backend, secret name and status                                                                            | `kubernetes_external_secrets_sync_calls_count{name="foo",namespace="example",backend="foo",status="success"} 1` |
| `kubernetes_external_secrets_last_sync_call_state` | Gauge   | State of last sync call of external secert, where -1 means the last sync_call was an error and 1 means the last sync_call was a success | `kubernetes_external_secrets_last_sync_call_state{name="foo",namespace="example",backend="foo"} 1`              |

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
