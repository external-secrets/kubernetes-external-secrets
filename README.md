[![Join Slack](https://img.shields.io/badge/Join%20us%20on-Slack-e01563.svg)](https://godaddy-oss-slack.herokuapp.com/) [![Greenkeeper badge](https://badges.greenkeeper.io/godaddy/kubernetes-external-secrets.svg)](https://greenkeeper.io/)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

# 💂 Kubernetes External Secrets

Kubernetes External Secrets allows you to use external secret management systems (*e.g.*, [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)) to securely add secrets in Kubernetes. Read more about the design and motivation for Kubernetes External Secrets on the [GoDaddy Engineering Blog](https://godaddy.github.io/2019/04/16/kubernetes-external-secrets/).

## How it works

The project extends the Kubernetes API by adding a `ExternalSecrets` object using [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and a controller to implement the behavior of the object itself.

An `ExternalSecret` declares how to fetch the secret data, while the controller converts all `ExternalSecrets` to `Secrets`.
The conversion is completely transparent to `Pods` that can access `Secrets` normally.

## System architecture

![Architecture](architecture.png)

1. `ExternalSecrets` are added in the cluster (e.g., `kubectly apply -f external-secret-example.yml`)
1. Controller fetches `ExternalSecrets` using the Kubernetes API
1. Controller uses `ExternalSecrets` to fetch secret data from external providers (e.g, AWS Secrets Manager)
1. Controller upsert `Secrets`
1. `Pods` can access `Secrets` normally

## How to use it

### Install with kubectl

To create the necessary resource and install the controller run:

```sh
kubectl apply -f https://raw.githubusercontent.com/godaddy/kubernetes-external-secrets/master/external-secrets.yml
```

This creates all the necessary resources and a `Deployment` in the `kubernetes-external-secrets` namespace.

### Install with Helm

Alternatively, the included [charts/kubernetes-external-secrets](charts/kubernetes-external-secrets) can be used to create the `kubernetes-external-secrets` resources and `Deployment` on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

#### Installing the Chart

```bash
helm install --name kubernetes-external-secrets \
charts/kubernetes-external-secrets
```

> **Tip:** A namespace can be specified by the `Helm` option '`--namespace kube-external-secrets`'

#### Uninstalling the Chart

To uninstall/delete the `kubernetes-external-secrets` deployment:

```bash
helm delete kubernetes-external-secrets
```

#### Configuration

The following table lists the configurable parameters of the `kubernetes-external-secrets` chart and their default values.

| Parameter                            | Description                                                  | Default                                                 |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------- |
| `env.AWS_REGION`             | Set AWS_REGION in Deployment Pod                     | `us-west-2`                                             |
| `env.EVENTS_INTERVAL_MILLISECONDS`   | Set EVENTS_INTERVAL_MILLISECONDS in Deployment Pod           | `60000`                                                 |
| `env.POLLER_INTERVAL_MILLISECONDS`   | Set POLLER_INTERVAL_MILLISECONDS in Deployment Pod           | `10000`                                                 |
| `image.repository`                   | kubernetes-external-secrets Image name                       | `godaddy/kubernetes-external-secrets`                   |
| `image.tag`                          | kubernetes-external-secrets Image tag                        | `1.2.0`                                                 |
| `image.pullPolicy`                   | Image pull policy                                            | `IfNotPresent`                                          |
| `rbac.create`                        | Create & use RBAC resources                                  | `true`                                                  |
| `serviceAccount.create`              | Whether a new service account name should be created.        | `true`                                                  |
| `serviceAccount.name`                | Service account to be used. If not set and serviceAccount.create is `true` a name is generated using the fullname template. | |
| `podAnnotations`                     | Annotations to be added to pods                              | `{}`                                                    |
| `replicaCount`                       | Number of replicas                                           | `1`                                                     |
| `nodeSelector`                       | node labels for pod assignment                               | `{}`                                                    |
| `tolerations`                        | List of node taints to tolerate (requires Kubernetes >= 1.6) | `[]`                                                    |
| `affinity`                           | Affinity for pod assignment                                  | `{}`                                                    |
| `resources`                          | Pod resource requests & limits                               | `{}`                                                    |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
helm install --name kubernetes-external-secrets \
--set env.AWS_REGION='ap-southeast-2' \
--set env.POLLER_INTERVAL_MILLISECONDS='300000' \
--set podAnnotations."iam\.amazonaws\.com/role"='Name-Of-IAM-Role-With-SecretManager-Access' \
charts/kubernetes-external-secrets
```

### Add a secret

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
secretDescriptor:
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

The controller needs to access AWS Secrets Manager via a role. How depends on your cluster setup, [kube2iam](https://github.com/jtblin/kube2iam) and [kiam](https://github.com/uswitch/kiam) are the most common

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetRandomPassword",
                "secretsmanager:GetResourcePolicy",
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
                "secretsmanager:ListSecrets",
                "secretsmanager:ListSecretVersionIds"
            ],
            "Resource": "*"
        }
    ]
}
```

## Backends

kubernetes-external-secrets supports only AWS Secrets Manager.

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
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: hello-service
secretDescriptor:
  backendType: secretsManager
  data:
    - key: hello-service/credentials
      name: password
      property: password
    - key: hello-service/credentials
      name: username
      property: username
```

## Development

[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a tool that makes it easy to run a Kubernetes cluster locally.

Start minikube and the daemon. This creates the `CustomerResourceDefinition`, and starts to process `ExternalSecrets`:

```sh
minikube start

npm run nodemon
```
