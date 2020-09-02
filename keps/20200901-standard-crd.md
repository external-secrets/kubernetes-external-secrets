```yaml
---
title: Standardize ExternalSecret CRD
authors: all of us
creation-date: 2020-09-01
status: draft
---
```

# Standardize ExternalSecret CRD

## Table of Contents

<!-- toc -->
- [Summary](#summary)
- [Motivation](#motivation)
  - [Goals](#goals)
  - [Non-Goals](#non-goals)
- [Terminology](#terminology)
- [Use-Cases](#use-cases)
- [Proposal](#proposal)
  - [API](#api)
- [Alternatives](#alternatives)
<!-- /toc -->

## Summary

This is a proposal to standardize the `ExternalSecret` CRD in an combined effort through all projects that deal with syncing external secrets. This proposal aims to do find the _common denominator_ for all users of `ExternalSecrets`.

## Motivation

There are a lot of different projects in the wild that essentially do the same thing: sync secrets with Kubernetes. The idea is to unify efforts into a single project that serves the needs of all users in this problem space.

As a starting point i would like to define a **common denominator** for a CustomResourceDefinition that serves all known use-cases. This CRD should follow the standard alpha -> beta -> GA feature process.

Once the CRD API is defined we can move on with more delicate discussions about technology, organization and processes.

### Goals

- Define a alpha CRD
- Fully document the Spec and use-cases

### Non-Goals

This KEP proposes the CRD Spec and documents the use-cases, not the choice of technology or migration path towards implementing the CRD.

## Terminology

* Kubernetes External Secrets `KES`: A Application that runs a control loop which syncs secrets
* KES `instance`: A single entity that runs a control loop.
* ExternalSecret `ES`: A CustomResource that declares which secrets should be synced
* Backend: A **source** for secrets. The Backend is external to the cluster. E.g.: Alibabacloud SecretsManager, AWS SystemsManager, Azure KeyVault...
* Frontend: A **sink** for the synced secrets. Usually a `ConfigMap` or `Secret`
* Secret: credentials that act as a key to sensitive information

## Use-Cases
* one global KES instance that manages ES in **all namespaces**, which gives access to **all backends**, with ACL
* multiple global KES instances, each manages access to a single or multiple backends (e.g.: shard by stage or team...)
* one KES per namespace (a user manages his/her own KES instance)

### User definitions
* `operator :=` i manage one or multiple `KES` instances
* `user :=` i only create `ES`, KES is managed by someone else

### User Stories
From that we can derive the following requirements or user-stories:
1. AS a KES operator i want to run multiple KES instances per cluster (e.g. one KES instance per DEV/PROD)
2. AS a KES operator or user i want to integrate **multiple backends** from a **single KES instance** (e.g. dev namespace has access only to dev secrets)
3. AS a KES user i want to control the sink for the secrets (aka frontend: store secret as `kind=ConfigMap` or `kind=Secret`)
4. AS a KES user i want to fetch **from multiple** Backends and store the secrets **in a single** Frontend
5. AS a KES operator i want to limit the access to certain backends or subresources (e.g. having one central KES instance that handles all ES - similar to `iam.amazonaws.com/permitted` annotation per namespace)

### Backends

These backends are relevant:
* AWS Secure Systems Manager Parameter Store
* AWS Secrets Manager
* Hashicorp Vault
* Azure Key Vault
* Alibaba Cloud KMS Secret Manager
* Google Cloud Platform Secret Manager
* Kubernetes (see #422)
* noop (see #476)

### Frontends

* Kind=Secret
* Kind=ConfigMap
* *potentially* we could sync backend to backend

## Proposal

### API

### External Secret

The `ExternalSecret` CustomResourceDefinition is **namespaced**. It defines the following:
1. source for the secret (backend)
2. sink for the secret (fronted)
3. and a mapping to translate the keys

```yaml
apiVersion: kes.io/v1alpha1
kind: ExternalSecret
metadata: {...}

spec:

  # optional.
  # used to select the correct KES instance (think: ingress.ingressClassName)
  # There is no need for a indirection (e.g. having a extra resource like kind=IngressClass)
  # the KES controller is instantiated with a specific class name
  # and filters ES based on this property
  externalSecretClassName: "dev"

  # This is the "simple" version to specify a single backend which will be used by all keys
  # we can have multiple backends per ES (they can be declared per key)
  # Each backend does need a configuration (e.g. AWS IAM Roles, AWS Region, GCP project-id, )
  backend:
    type: secretsManager
    # optional additional config
    secretsManager:
      region: eu-central-1
      accessKeyID: AKIAIOSFODNN7EXAMPLE
      roleARN: arn:aws:iam::YYYYYYYYYYYY:role/kes-full-access

  # there can only be one frontend per ES
  # this is the "thing" that is created by KES.
  # conceptually speaking a frontend is just a thing that can hold k/v pairs
  frontend:
    secret:
      # do we need a api version here? who handles upgrades?
      apiVersion: v1
      name: my-secret
      template:
        type: kubernetes.io/dockerconfigjson # or TLS...
        metadata:
          annotations: {}
          labels: {}
    # of course only one frontend should be defined
    configMap:
      # do we need a api version here? who handles upgrades?
      apiVersion: v1 #
      name: my-configmap
      template:
        metadata:
          labels:
            app: foo

  data:
    # EXAMPLE 1: simple mapping
    # one key in a backend may hold multiple values
    # we need a way to map the values to the frontend
    # it is the responsibility of the backend implementation to know how to extract a value
  - key: /corp.org/dev/certs/ingress
    property: pubcert
    name: tls.crt
  - key: /corp.org/dev/certs/ingress
    property: privkey
    name: tls.key

  # EXAMPLE 2: multiple backends per ES
  # we also need a way to fetch secrets from multiple backend
  # thus, we need a way to define a backend per data key
  - key: /rds/database-secret
    name: database
    backend:
      type: SecretsManager
      secretsManager:
        roleARN: arn:aws:iam::YYYYYYYYYYYY:role/kes-ssm-access
  - key: /users/my-db-user
    name: username
    backend:
      type: SystemsManager
      systemsManager:
        roleARN: arn:aws:iam::XXXXXXXXXXXX:role/kes-sm-access

# status holds the timestamp and status of last last sync
status:
  lastSync: 2020-09-01T18:19:17.263Z # ISO 8601 date string
  status: success # or failure

```

This API makes the options more explicit rather than having annotations.


### External Secret Backend

The Backend configuration in an `ExternalSecret` may contain a lot of redundancy, this can be factored out into its own CRD.
These backends are defined in a particular namespace using `SecretBackend` **or** globally with `GlobalSecretBackend`.

```yaml
apiVerson: kes.io/v1alpha1
kind: SecretBackend # or GlobalSecretBackend
metadata:
  name: vault
  namespace: example-ns # TODO: namespaced?
spec:
  vault:
    server: "https://vault.example.com"
    path: secret/data
    auth:
      kubernetes:
        path: kubernetes
        role: example-role
        secretRef:
          name: vault-secret
```

Example Secret that uses the reference to a backend
```yaml
apiVersion: kes.io/v1alpha1
kind: ExternalSecret
metadata:
  name: foo
spec:
  externalSecretClassName: "example"
  backend:
    type: BackendRef # or GlobalBackendRef
    backendRef:
      name: vault # this must exist in the same namespace
  frontend:
    secret:
      name: my-secret
      template:
        type: kubernetes.io/TLS
  data:
  - key: /corp.org/dev/certs/ingress
    property: pubcert
    name: tls.crt
  - key: /corp.org/dev/certs/ingress
    property: privkey
    name: tls.key
```

Workflow in a KES instance:
1. A user creates a CRD with a certain `spec.externalSecretClassName`
2. A controller picks up the `ExternalSecret` if it matches the `className`
3. a) It fetches the `SecretBackend` or `GlobalSecretBackend` defined in `spec.backend.backendRef` and applies it. This does also apply to `spec.data[].backend`

## Alternatives
