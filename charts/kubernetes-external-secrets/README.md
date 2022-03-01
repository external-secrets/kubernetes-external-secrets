# ⚠️ Deprecated

This project has been [deprecated](https://github.com/external-secrets/kubernetes-external-secrets/issues/864).
Please take a look at ESO (External Secrets Operator) instead https://github.com/external-secrets/external-secrets

# 💂 Kubernetes External Secrets

[Kubernetes External Secrets](https://github.com/external-secrets/kubernetes-external-secrets) allows you to use external secret management systems (*e.g.*, [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)) to securely add secrets in Kubernetes. Read more about the design and motivation for Kubernetes External Secrets on the [GoDaddy Engineering Blog](https://godaddy.github.io/2019/04/16/kubernetes-external-secrets/).

## TL;DR;

```bash
$ helm repo add external-secrets https://external-secrets.github.io/kubernetes-external-secrets/
$ helm install [RELEASE_NAME] external-secrets/kubernetes-external-secrets
```

See below for [Helm V2 considerations](#helm-v2-considerations) when installing the chart.

## Prerequisites

* Kubernetes 1.16+

## Installing the Chart

To install the chart with the release named `my-release`:

```bash
$ helm install my-release external-secrets/kubernetes-external-secrets
```

To install the chart with [AWS IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html):

```bash
$ helm install my-release external-secrets/kubernetes-external-secrets --set securityContext.fsGroup=65534 --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"='arn:aws:iam::111111111111:role/ROLENAME'
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
| `env.AWS_INTERMEDIATE_ROLE_ARN`           | Specifies a role to be assumed before assuming role arn specified in external secrets                                             |                                       |
| `env.LOG_LEVEL`                           | Set the application log level                                                                                                     | `info`                                |
| `env.LOG_MESSAGE_KEY`                     | Set the key for log messages log text, for example when running on GCP it might be nice to set to `message`                       | `msg`                                 |
| `env.LOG_BASE_PID_KEY`                    | Set the key for log messages process id                                                                                           | `pid`                                 |
| `env.LOG_BASE_HOSTNAME_KEY`               | Set the key for log messages hostname, for example, you might choose to use `pod_name`                                            | `hostname`                            |
| `env.USE_HUMAN_READABLE_LOG_LEVELS`       | Sets log levels as string instead of ints eg `info` instead of `30`, setting this to any value will switch                        | `nil`                                 |
| `env.METRICS_PORT`                        | Specify the port for the prometheus metrics server                                                                                | `3001`                                |
| `env.ROLE_PERMITTED_ANNOTATION`           | Specify the annotation key where to lookup the role arn permission boundaries                                                     | `iam.amazonaws.com/permitted`         |
| `env.POLLER_INTERVAL_MILLISECONDS`        | Set POLLER_INTERVAL_MILLISECONDS in Deployment Pod                                                                                | `10000`                               |
| `env.VAULT_ADDR`                          | Endpoint for the Vault backend, if using Vault                                                                                    | `http://127.0.0.1:8200`                |
| `env.AKEYLESS_API_ENDPOINT`                          | Endpoint for the akeyless backend, if using Akeyless                                                                                    | `https://api.akeyless.io`                |
| `env.AKEYLESS_ACCESS_ID`                          | Akeyless access-id , if using Akeyless                                                                                    | `nil`                |
| `env.AKEYLESS_ACCESS_TYPE`                          | Akeyless access-type (aws_iam/gcp/azure_ad/access_key), if using Akeyless                                                                                    | `nil`                |
| `env.AKEYLESS_ACCESS_TYPE_PARAM`                          | Additional parameter per access type, if using Akeyless                                                                                    | `nil`                |
| `env.DISABLE_POLLING`                     | Disables backend polling and only updates secrets when ExternalSecret is modified, setting this to any value will disable polling | `nil`                                 |
| `env.WATCH_TIMEOUT`                     | Restarts the external secrets resource watcher if no events have been seen in this time period (miliseconds) | `60000`                                 |
| `env.WATCHED_NAMESPACES`                     | Limits which namespaces the controller will watch, by default all namespaces will be watched. Comma separated list `qa,stage` | `''`                                 |
| `envVarsFromSecret.AWS_ACCESS_KEY_ID`     | Set AWS_ACCESS_KEY_ID (from a secret) in Deployment Pod                                                                           |                                       |
| `envVarsFromSecret.AWS_SECRET_ACCESS_KEY` | Set AWS_SECRET_ACCESS_KEY (from a secret) in Deployment Pod                                                                       |                                       |
| `envVarsFromSecret.AZURE_TENANT_ID`       | Set AZURE_TENANT_ID (from a secret) in Deployment Pod                                                                             |                                       |
| `envVarsFromSecret.AZURE_CLIENT_ID`       | Set AZURE_CLIENT_ID (from a secret) in Deployment Pod                                                                             |                                       |
| `envVarsFromSecret.AZURE_CLIENT_SECRET`   | Set AZURE_CLIENT_SECRET (from a secret) in Deployment Pod                                                                         |                                       |
| `envVarsFromSecret.ALICLOUD_ENDPOINT`     | Set ALICLOUD_ENDPOINT for KMS Service in Deployment Pod                                                                           |                                       |
| `envVarsFromSecret.ALICLOUD_ACCESS_KEY_ID`     | Set ALICLOUD_ACCESS_KEY_ID (from a secret) in Deployment Pod                                                                 |                                       |
| `envVarsFromSecret.ALICLOUD_ACCESS_KEY_SECRET` | Set ALICLOUD_ACCESS_KEY_SECRET (from a secret) in Deployment Pod                                                             |                                       |
| `envVarsFromConfigMap.*` | Set any of the environment variables as `envVarsFromSecret` does but from a `configMap` in Deployment Pod                                                             |                                       |
| `envFrom` | Enables the [`envFrom` block](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#configure-all-key-value-pairs-in-a-configmap-as-container-environment-variables) on the Deployment pod                                                              |                                       |
| `image.repository`                        | kubernetes-external-secrets Image name                                                                                            | `godaddy/kubernetes-external-secrets` |
| `image.tag`                               | kubernetes-external-secrets Image tag                                                                                             | `8.5.4`                               |
| `image.pullPolicy`                        | Image pull policy                                                                                                                 | `IfNotPresent`                        |
| `nameOverride`                            | Override the name of app                                                                                                          | `nil`                                 |
| `fullnameOverride`                        | Override the full name of app                                                                                                     | `nil`                                 |
| `rbac.create`                             | Create & use RBAC resources                                                                                                       | `true`                                |
| `securityContext`                         | Pod-wide security context                                                                                                         | `{ runAsNonRoot: true }`              |
| `serviceAccount.create`                   | Whether a new service account name should be created.                                                                             | `true`                                |
| `serviceAccount.name`                     | Service account to be used.                                                                                                       | automatically generated               |
| `serviceAccount.annotations`              | Annotations to be added to service account                                                                                        | `nil`                                 |
| `deploymentLabels`                        | Additional labels to be added the deployment                                                                                      | `{}`                                  |
| `podAnnotations`                          | Annotations to be added to pods                                                                                                   | `{}`                                  |
| `podLabels`                               | Additional labels to be added to pods                                                                                             | `{}`                                  |
| `priorityClassName`                       | Priority class to be assigned to pods
| `replicaCount`                            | Number of replicas                                                                                                                | `1`                                   |
| `nodeSelector`                            | node labels for pod assignment                                                                                                    | `{}`                                  |
| `tolerations`                             | List of node taints to tolerate (requires Kubernetes >= 1.6)                                                                      | `[]`                                  |
| `affinity`                                | Affinity for pod assignment                                                                                                       | `{}`                                  |
| `resources`                               | Pod resource requests & limits                                                                                                    | `{}`                                  |
| `dnsConfig`                               | Dns Config for pod.                                                                                                   | `{}`                                  |
| `imagePullSecrets`                        | Reference to one or more secrets to be used when pulling images                                                                   | `[]`                                  |
| `podDisruptionBudget`                     | PodDisruptionBudget for pod.                                                                                                      | `{}`                                  |
| `serviceMonitor.enabled`                  | Enable the creation of a serviceMonitor object for the Prometheus operator                                                        | `false`                               |
| `serviceMonitor.interval`                 | The interval the Prometheus endpoint is scraped                                                                                   | `30s`                                 |
| `serviceMonitor.namespace`                | The namespace where the serviceMonitor object has to be created                                                                   | `nil`                                 |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
helm install my-release external-secrets/kubernetes-external-secrets \
--set env.POLLER_INTERVAL_MILLISECONDS='300000' \
--set podAnnotations."iam\.amazonaws\.com/role"='Name-Of-IAM-Role-With-SecretManager-Access'
```

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
helm install my-release external-secrets/kubernetes-external-secrets -f values.yaml
```

> **Tip**: You can use the default [values.yaml](https://github.com/external-secrets/kubernetes-external-secrets/blob/master/charts/kubernetes-external-secrets/values.yaml)

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

For more in-depth documentation of usage, please see the [Kubernetes External Secrets repo](https://github.com/external-secrets/kubernetes-external-secrets)
