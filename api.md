# Kubernetes External Secrets Storage Frontends

Kubernetes External Secrets supports several "frontends" for storing
secret data and presenting it to applications:

* [Secret frontend](#secret-frontend)
* [Volume frontend](#volume-frontend)

## Secret frontend

TODO.

## Volume frontend

The volume frontend writes secret data to volumes included in `Pod`
specs. The volume frontend implements a behavior analogous to the
secret volume type. You specify `ExternalSecret` objects to use as
volumes and the External Secret controller creates files containing
secret data.

To emulate an "externalSecret" volume type, you configure which
volumes the External Secret controller writes data to by adding the
`externalsecrets.kubernetes-client.io/volumes` annotation to a `Pod`
manifest". With the manifest below, the External Secret controller
should:

* create password and username files in the db-secrets volume;
* fetch the value of db/password from AWS Secrets Manager and write
  that value to password file in the db-secrets volume;
* fetch the value of db/username from AWS Secrets Manager and write
  that value to the username file in the db-secrets volume;
* create a key file in the client-secrets volume; and
* fetch the value of api/key from AWS Secrets Manager and write that
  values to the api file in the client-secrets volume.

```yaml
apiVersion: v1
kind: Pod
metadata:
  generateName: pod-example-
  annotations:
    externalsecrets.kubernetes-client.io/volumes: |
      - name: "db-secrets"
        externalSecret:
          externalSecretName: "db-secrets"
      - name: "client-secrets"
        externalSecret:
          externalSecretName: "client-secrets"
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
---
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: db-secrets
spec:
  backendType: secretsManager
  data:
    - key: db/password
      name: password
    - key: db/username
      name: username
---
apiVersion: 'kubernetes-client.io/v1'
kind: ExternalSecret
metadata:
  name: client-secrets
spec:
  backendType: secretsManager
  data:
    - key: api/key
      name: key
```

The value of `externalsecrets.kubernetes-client.io/volumes` is a JSON or
YAML serialized array of volume configuration objects:

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
