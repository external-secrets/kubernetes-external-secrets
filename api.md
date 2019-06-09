# Kubernetes External Secrets Storage Frontends

Kubernetes External Secrets supports several "frontends" for storing
secret data and presenting it to applications:

* [Secret frontend](#secret-frontend)
* [Volume frontend](#volume-frontend)

## Secret frontend

TODO.

## Volume frontend

The volume frontend writes secret data to volumes included in `Pod`
specs. You configure which volumes the External Secret controller
writes data to by adding the
`externalsecrets.kubernetes-client.io/volumes` annotation to a `Pod`
manifest:

```yaml
apiVersion: v1
kind: Pod
metadata:
  generateName: pod-example-
  annotations:
    externalsecrets.kubernetes-client.io/volumes: >
      [
        {"name": "db-secrets", "externalSecretName": "db-secrets"},
        {"name": "client-secrets", "externalSecretName": "client-secrets"}
      ]
spec:
  containers:
  - image: busybox
    name: busybox
    volumeMounts:
    - mountPath: /db-secrets
      name: db-secrets
    - mountPath: /client-secrets
      name: client-secrets
  volumes:
  - name: db-secrets
    emptyDir:
      medium: Memory
  - name: client-secrets
    emptyDir:
      medium: Memory
```

The value of `externalsecrets.kubernetes-client.io/volumes` is a JSON
array of volume configuration objects:

|Property|Type|Description|
|--------|----|-----------|
|`name`|string|Name of volume to write secret data to|
|`externalSecretName`|string|Name of ExternalSecret to get secret data from|

You can configure any [type of
volume](https://kubernetes.io/docs/concepts/storage/volumes/#types-of-volumes)
to hold secret data. To avoid storing secret data on disk,
use an
[`emptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
volume and set `emptyDir.medium` field to `"Memory"`.
