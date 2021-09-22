# e2e tests

## Running e2e tests

Prerequisites:
* docker
* kind
* helm
* kubectl

Run them from the root of the repository `npm run test-e2e`.


## Developing e2e tests

To better understand how they are being run take a look at `run-e2e-suite.sh`.

1. Prepare the environment

```
kind create cluster \
  --name es-dev-cluster \
  --config ./kind.yaml \
  --image "kindest/node:v1.16.15"

export KUBECONFIG="$(kind get kubeconfig-path --name="es-dev-cluster")"

# build & load images
docker build -t external-secrets:test -f ../Dockerfile ../
kind load docker-image --name="es-dev-cluster" external-secrets:test

# prep localstack
kubectl apply -f ./localstack.deployment.yaml

# deploy external secrets
helm template e2e ../charts/kubernetes-external-secrets \
  --set image.repository=external-secrets \
  --set image.tag=test \
  --set env.LOG_LEVEL=debug \
  --set env.LOCALSTACK=true \
  --set env.LOCALSTACK_SSM_URL=http://ssm \
  --set env.LOCALSTACK_SM_URL=http://secretsmanager \
  --set env.AWS_ACCESS_KEY_ID=foobar \
  --set env.AWS_SECRET_ACCESS_KEY=foobar \
  --set env.AWS_REGION=us-east-1 \
  --set env.POLLER_INTERVAL_MILLISECONDS=1000 \
  --set env.LOCALSTACK_STS_URL=http://sts | kubectl apply -f -

# prep e2e test
kubectl create serviceaccount external-secrets-e2e || true
kubectl create clusterrolebinding permissive-binding \
  --clusterrole=cluster-admin \
  --user=admin \
  --user=kubelet \
  --serviceaccount=default:external-secrets-e2e || true

# make sure that everything is running
kubectl rollout status deploy/localstack
kubectl rollout status deploy/release-name-kubernetes-external-secrets
```

2. build image & deploy to start the e2e test

```
docker build -t external-secrets-e2e:test -f Dockerfile ../
kind load docker-image --name="es-dev-cluster" external-secrets-e2e:test
kubectl run \
  --rm \
  --attach \
  --restart=Never \
  --env="LOCALSTACK=true" \
  --env="LOCALSTACK_SSM_URL=http://ssm" \
  --env="LOCALSTACK_SM_URL=http://secretsmanager" \
  --env="AWS_ACCESS_KEY_ID=foobar" \
  --env="AWS_SECRET_ACCESS_KEY=foobar" \
  --env="AWS_REGION=us-east-1" \
  --env="LOCALSTACK_STS_URL=http://sts" \
  --overrides='{ "apiVersion": "v1", "spec":{"serviceAccountName": "external-secrets-e2e"}}' \
  e2e --image=external-secrets-e2e:test
``
