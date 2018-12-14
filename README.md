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

To create the necessary resource and install the controller run:

```sh
kubectl apply -f https://raw.githubusercontent.com/godaddy/kubernetes-external-secrets/master/external-secrets.yml
```

This create all the necessary resources and a `Deployment` in the `kubernetes-external-secrets` namespace.

### Add a secret

Add secret data in your external provider (e.g., `hello-service/password=1234` in AWS Secrets Manager), then create a `hello-service-external-secret.yml` file:

```yml
apiVersion: 'kubernetes-client.io/v1'
kind: ExtrenalSecret
metadata:
  name: hello-service
secretDescriptor:
  backendType: secretManager
  properties:
    - key: hello-service/password
      name: password
```

Save the file and run:

```sh
kubectl apply -f hello-service-external-secret.yml
```

Wait few minutes and verify that the associated `Secret` has been created:

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

Currently we only support AWS Secrets Manager external provider.

## Development

[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a tool that makes it easy to run a Kubernetes cluster locally.

Start minikube and the daemon. This creates the `CustomerResourceDefinition`, and starts to process `ExternalSecrets`:

```sh
minikube start

npm start
```
