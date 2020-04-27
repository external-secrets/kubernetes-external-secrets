# 💂 Kubernetes External Secrets

[Kubernetes External Secrets](https://github.com/godaddy/kubernetes-external-secrets) allows you to use external secret management systems (*e.g.*, [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)) to securely add secrets in Kubernetes. Read more about the design and motivation for Kubernetes External Secrets on the [GoDaddy Engineering Blog](https://godaddy.github.io/2019/04/16/kubernetes-external-secrets/).

## TL;DR;

```bash
$ helm repo add external-secrets https://godaddy.github.io/kubernetes-external-secrets/
$ helm install external-secrets/kubernetes-external-secrets
```

## Prerequisites

* Kubernetes 1.12+

## Installing the Chart

To install the chart with the release named `my-release`:

```bash
$ helm install --name my-release external-secrets/kubernetes-external-secrets
```

> **Tip:** A namespace can be specified by the `Helm` option '`--namespace kube-external-secrets`'

To install the chart with [AWS IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html):

```bash
$ helm install --name my-release --set securityContext.fsGroup=65534 --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"='arn:aws:iam::111111111111:role/ROLENAME' external-secrets/kubernetes-external-secrets
```

## Uninstalling the Chart

To uninstall/delete the deployment:

```bash
helm delete my-release
```

## Configuration

The following table lists the configurable parameters of the `kubernetes-external-secrets` chart and their default values.

| Parameter                                 | Description                                                                                                                       | Default                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `env.AWS_REGION`                          | Set AWS_REGION in Deployment Pod                                                                                                  | `us-west-2`                           |
| `env.LOG_LEVEL`                           | Set the application log level                                                                                                     | `info`                                |
| `env.METRICS_PORT`                        | Specify the port for the prometheus metrics server                                                                                | `3001`                                |
| `env.ROLE_PERMITTED_ANNOTATION`           | Specify the annotation key where to lookup the role arn permission boundaries                                                     | `iam.amazonaws.com/permitted`         |
| `env.POLLER_INTERVAL_MILLISECONDS`        | Set POLLER_INTERVAL_MILLISECONDS in Deployment Pod                                                                                | `10000`                               |
| `env.VAULT_ADDR`                          | Endpoint for the Vault backend, if using Vault                                                                                    | `http://127.0.0.1:8200                |
| `env.DISABLE_POLLING`                     | Disables backend polling and only updates secrets when ExternalSecret is modified, setting this to any value will disable polling | `nil`                                 |
| `envVarsFromSecret.AWS_ACCESS_KEY_ID`     | Set AWS_ACCESS_KEY_ID (from a secret) in Deployment Pod                                                                           |                                       |
| `envVarsFromSecret.AWS_SECRET_ACCESS_KEY` | Set AWS_SECRET_ACCESS_KEY (from a secret) in Deployment Pod                                                                       |                                       |
| `envVarsFromSecret.AZURE_TENANT_ID`       | Set AZURE_TENANT_ID (from a secret) in Deployment Pod                                                                             |                                       |
| `envVarsFromSecret.AZURE_CLIENT_ID`       | Set AZURE_CLIENT_ID (from a secret) in Deployment Pod                                                                             |                                       |
| `envVarsFromSecret.AZURE_CLIENT_SECRET`   | Set AZURE_CLIENT_SECRET (from a secret) in Deployment Pod                                                                         |                                       |
| `image.repository`                        | kubernetes-external-secrets Image name                                                                                            | `godaddy/kubernetes-external-secrets` |
| `image.tag`                               | kubernetes-external-secrets Image tag                                                                                             | `3.2.0`                               |
| `image.pullPolicy`                        | Image pull policy                                                                                                                 | `IfNotPresent`                        |
| `nameOverride`                            | Override the name of app                                                                                                          | `nil`                                 |
| `fullnameOverride`                        | Override the full name of app                                                                                                     | `nil`                                 |
| `rbac.create`                             | Create & use RBAC resources                                                                                                       | `true`                                |
| `securityContext`                         | Pod-wide security context                                                                                                         | `{ runAsNonRoot: true }`              |
| `serviceAccount.create`                   | Whether a new service account name should be created.                                                                             | `true`                                |
| `serviceAccount.name`                     | Service account to be used.                                                                                                       | automatically generated               |
| `serviceAccount.annotations`              | Annotations to be added to service account                                                                                        | `nil`                                 |
| `podAnnotations`                          | Annotations to be added to pods                                                                                                   | `{}`                                  |
| `podLabels`                               | Additional labels to be added to pods                                                                                             | `{}`                                  |
| `replicaCount`                            | Number of replicas                                                                                                                | `1`                                   |
| `nodeSelector`                            | node labels for pod assignment                                                                                                    | `{}`                                  |
| `tolerations`                             | List of node taints to tolerate (requires Kubernetes >= 1.6)                                                                      | `[]`                                  |
| `affinity`                                | Affinity for pod assignment                                                                                                       | `{}`                                  |
| `resources`                               | Pod resource requests & limits                                                                                                    | `{}`                                  |
| `imagePullSecrets`                        | Reference to one or more secrets to be used when pulling images                                                                   | `[]`                                  |
| `serviceMonitor.enabled`                  | Enable the creation of a serviceMonitor object for the Prometheus operator                                                        | `false`                               |
| `serviceMonitor.interval`                 | The interval the Prometheus endpoint is scraped                                                                                   | `30s`                                 |
| `serviceMonitor.namespace`                | The namespace where the serviceMonitor object has to be created                                                                   | `nil`                                 |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
helm install external-secrets/kubernetes-external-secrets --name my-releases \
--set env.POLLER_INTERVAL_MILLISECONDS='300000' \
--set podAnnotations."iam\.amazonaws\.com/role"='Name-Of-IAM-Role-With-SecretManager-Access'
```

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
helm install external-secrets/kubernetes-external-secrets --name my-release -f values.yaml
```

> **Tip**: You can use the default [values.yaml](https://github.com/godaddy/kubernetes-external-secrets/blob/master/charts/kubernetes-external-secrets/values.yaml)

## Add a secret

Add your secret data to your backend. For example, AWS Secrets Manager:

```
aws secretsmanager create-secret --name hello-service/password --secret-string "1234"
```

and then create a `hello-service-external-secret.yml` file:

```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: hello-service
spec:
  backendType: secretsManager
  data:
    - key: hello-service/password
      name: password
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
type: Opaque
data:
  password: MTIzNA==
```

## Further Information

For more in-depth documentation of usage, please see the [Kubernetes External Secrets repo](https://github.com/godaddy/kubernetes-external-secrets)
