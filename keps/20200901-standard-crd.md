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

List of Projects known so far or related:
* https://github.com/godaddy/kubernetes-external-secrets
* https://github.com/itscontained/secret-manager
* https://github.com/ContainerSolutions/externalsecret-operator
* https://github.com/mumoshu/aws-secret-operator
* https://github.com/cmattoon/aws-ssm
* https://github.com/tuenti/secrets-manager
* https://github.com/kubernetes-sigs/k8s-gsm-tools

### Goals

- Define a alpha CRD
- Fully document the Spec and use-cases

### Non-Goals

This KEP proposes the CRD Spec and documents the use-cases, not the choice of technology or migration path towards implementing the CRD.

We do not want to sync secrets into a `ConfigMap`.

## Terminology

* Kubernetes External Secrets `KES`: A Application that runs a control loop which syncs secrets
* KES `instance`: A single entity that runs a control loop.
* ExternalSecret `ES`: A CustomResource that declares which secrets should be synced
* Store: Is a **source** for secrets. The Store is external to KES. It can be a hosted service like Alibabacloud SecretsManager, AWS SystemsManager, Azure KeyVault...
* Frontend: A **sink** for the synced secrets. Usually a `Secret`
* Secret: credentials that act as a key to sensitive information

## Use-Cases
* one global KES instance that manages ES in **all namespaces**, which gives access to **all stores**, with ACL
* multiple global KES instances, each manages access to a single or multiple stores (e.g.: shard by stage or team...)
* one KES per namespace (a user manages his/her own KES instance)

### User definitions
* `operator :=` i manage one or multiple `KES` instances
* `user :=` i only create `ES`, KES is managed by someone else

### User Stories
From that we can derive the following requirements or user-stories:
1. AS a KES operator i want to run multiple KES instances per cluster (e.g. one KES instance per DEV/PROD)
2. AS a KES operator or user i want to integrate **multiple stores** from a **single KES instance** (e.g. dev namespace has access only to dev secrets)
3. AS a KES user i want to control the sink for the secrets (aka frontend: store secret as `kind=Secret`)
4. AS a KES user i want to fetch **from multiple** stores and store the secrets **in a single** Frontend
5. AS a KES operator i want to limit the access to certain stores or subresources (e.g. having one central KES instance that handles all ES - similar to `iam.amazonaws.com/permitted` annotation per namespace)
4. AS a KES user i want to provide an application with a configuration that contains a secret

### Stores

These stores are relevant:
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
* *potentially* we could sync store to store

## Proposal

### API

### External Secret

The `ExternalSecret` CustomResourceDefinition is **namespaced**. It defines the following:
1. source for the secret (store)
2. sink for the secret (fronted)
3. and a mapping to translate the keys

```yaml
apiVersion: external-secrets.k8s.io/v1alpha1
kind: ExternalSecret
metadata: {...}

spec:

  # the amount of time before the values will be read again from the store
  refreshInterval: "1h"

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
        # use inline templates
        data:
          config.yml: |
            endpoints:
            - https://{{ .data.user }}:{{ .data.password }}@api.exmaple.com
        metadata:
          annotations: {}
          labels: {}

      # Uses an existing template from configmap
      # secret is fetched, merged and templated within the referenced configMap data
      # It does not update the configmap, it creates a secret with: data["alertmanager.yml"] = ...result...
      templateFrom:
      - configMap:
          name: alertmanager
          items:
          - key: alertmanager.yaml


  # data contains key/value pairs which correspond to the keys in the resulting secret
  data:

    # EXAMPLE 1: simple mapping
    # one key from a store may hold multiple values
    # we need a way to map the values to the frontend
    # it is the responsibility of the store implementation to know how to extract a value
    tls.crt:
      key: /corp.org/dev/certs/ingress
      property: pubcert
    tls.key:
      key: /corp.org/dev/certs/ingress
      property: privkey

  # used to fetch all properties from a secret.
  # if multiple dataFrom are specified, secrets are merged in the specified order
  dataFrom:
  - key: /user/all-creds

# status holds the timestamp and status of last last sync
status:
  lastSync: 2020-09-01T18:19:17.263Z # ISO 8601 date string
  status: success # or failure

```

This API makes the options more explicit rather than having annotations.


### External Secret Store

The store configuration in an `ExternalSecret` may contain a lot of redundancy, this can be factored out into its own CRD.
These stores are defined in a particular namespace using `SecretStore` **or** globally with `GlobalSecretStore`.

```yaml
apiVerson: external-secrets.k8s.io/v1alpha1
kind: SecretStore # or ClusterSecretStore
metadata:
  name: vault
  namespace: example-ns
spec:

  # optional.
  # used to select the correct KES controller (think: ingress.ingressClassName)
  # The KES controller is instantiated with a specific controller name
  # and filters ES based on this property
  controller: "dev"

  store:
    # store implementation
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

Example Secret that uses the reference to a store
```yaml
apiVersion: external-secrets.k8s.io/v1alpha1
kind: ExternalSecret
metadata:
  name: foo
spec:
  storeRef:
    kind: SecretStore # ClusterSecretStore
    name: my-store
  frontend:
    secret:
      name: my-secret
      template:
        type: kubernetes.io/TLS
  data:
    tls.crt:
      key: /corp.org/dev/certs/ingress
      property: pubcert
    tls.key:
      key: /corp.org/dev/certs/ingress
      property: privkey
```

Workflow in a KES instance:
1. A user creates a Store with a certain `spec.controller`
2. A controller picks up the `ExternalSecret` if it matches the `controller` field
3. The controller fetches the secret from the provider and stores it as kind=Secret in the same namespace as ES
