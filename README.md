# 💂 kubernetes external secrets

Kubernetes external secrets allow you to use external providers (e.g, [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)) to securely add secrets in Kubernetes.

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

### Install

Currently we do not support install via [Helm](https://helm.sh/) yet. To install the controller run:

```sh
kubectl create ns kubernetes-external-secrets
kubectl apply -f https://raw.githubusercontent.com/godaddy/kubernetes-external-secrets/master/external-secrets.yml
```

This create all the necessary resources and a `Deployment` in the `kubernetes-external-secrets` namespace.

### Add a secret

Add secret data in your external provider (e.g., `foobar-service/foo=bar` in AWS Secrets Manager), then create a `foobar-external-secret.yaml` file:

```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExtrenalSecret
metadata:
  name: foobar-secret
secretDescriptor:
  backendType: secretManager
  properties:
    - key: foobar-service/foo
      name: foo
```

Save the file and run:

```sh
create ns foobar
kubectl apply -f foobar-external-secret.yaml -n=foobar
```

Wait few minutes and verify that the associated `Secret` has been created:

```sh
kubectl get secret foobar-secret -o=yaml -n=foobar
```

The `Secret` created by the controller should look like:

```yml
apiVersion: v1
kind: Secret
metadata:
  name: foobar-secret
type: Opaque
data:
  foo: YmFy
```

Currently we only support AWS Secrets Manager external provider.

## Development

You can run the project locally using [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/). Minikube is a tool that makes it easy to run a Kubernetes cluster locally.

```sh
# start minikube
minikube start

# create kubernetes resources
kubectl apply -f external-secrets.yml -n=kubernetes-external-secrets
```

Verify that the system is working correctly running:

```js
kubectl get pods -n=kubernetes-external-secrets
```
