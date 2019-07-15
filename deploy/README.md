# Installing external secrets via kubectl

## Deploying the config map

The external secrets daemon is configured via environment variables. These are provided via a
kubernetes [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/).

To create the ConfigMap:
1. Review (external-secrets-env.properties) to make sure the values are correct for your cluster
1. Create the ConfigMap via `
kubectl create configmap external-secrets-config --from-env-file=external-secrets-env.properties
`

## Deploying the external secrets manager daemon

Deploy via `kubectl create -f deploy/deploy.yml`

### Configuration

The following table lists the configurable parameters of the `kubernetes-external-secrets` daemon and their default values.

| Parameter                      | Description                                         | Default        |
| ------------------------------ | --------------------------------------------------- | -------------- |
| `AWS_REGION`                   | Set AWS_REGION in Deployment Pod                    | `us-west-2`    |
| `EVENTS_INTERVAL_MILLISECONDS` | Set EVENTS_INTERVAL_MILLISECONDS in Deployment Pod  | `60000`        |
| `POLLER_INTERVAL_MILLISECONDS` | Set POLLER_INTERVAL_MILLISECONDS in Deployment Pod  | `10000`        |
| `AWS_ACCESS_KEY_ID`            | Set AWS_ACCESS_KEY_ID in Deployment Pod             |                |
| `AWS_SECRET_ACCESS_KEY`        | Set AWS_SECRET_ACCESS_KEY in Deployment Pod         |                |