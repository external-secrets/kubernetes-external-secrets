#!/bin/bash

# Copyright 2018 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
KIND_LOGGING=""
if ! [ -z "$DEBUG" ]; then
    set -x
    KIND_LOGGING="--verbosity=4"
    kind version
    kubectl version --client
    helm version --client
fi

set -o errexit
set -o nounset
set -o pipefail

RED='\e[35m'
NC='\e[0m'
BGREEN='\e[32m'

K8S_VERSION=${K8S_VERSION:-v1.16.15}
KIND_CLUSTER_NAME="external-secrets-dev"
REGISTRY=external-secrets

export KUBECONFIG="$(pwd)/e2e/.kubeconfig"

kind --version || $(echo -e "${RED}Please install kind before running e2e tests${NC}";exit 1)
echo -e "${BGREEN}[dev-env] creating Kubernetes cluster with kind${NC}"

kind create cluster \
  ${KIND_LOGGING} \
  --name ${KIND_CLUSTER_NAME} \
  --config "${DIR}/kind.yaml" \
  --image "kindest/node:${K8S_VERSION}"

echo -e "${BGREEN}building external-secrets images${NC}"
docker build -t external-secrets:test -f "$DIR/../Dockerfile" "$DIR/../"
docker build -t external-secrets-e2e:test -f "$DIR/Dockerfile" "$DIR/../"
kind load docker-image --name="${KIND_CLUSTER_NAME}" external-secrets-e2e:test
kind load docker-image --name="${KIND_CLUSTER_NAME}" external-secrets:test

function cleanup {
  set +e
  kubectl delete pod e2e 2>/dev/null
  kubectl delete crd/externalsecrets.kubernetes-client.io 2>/dev/null
  kubectl delete -f "${DIR}/localstack.deployment.yaml" 2>/dev/null
  kind delete cluster \
    ${KIND_LOGGING} \
    --name ${KIND_CLUSTER_NAME}

}
trap cleanup EXIT

kubectl apply -f ${DIR}/localstack.deployment.yaml

CHART_DIR="$(dirname "$DIR")/charts/kubernetes-external-secrets"
HELM_TEMPLATE_ARGS="e2e ${CHART_DIR}"

helm template ${HELM_TEMPLATE_ARGS} \
  --include-crds \
  --set image.repository=external-secrets \
  --set image.tag=test \
  --set env.LOG_LEVEL=debug \
  --set env.LOCALSTACK=true \
  --set env.LOCALSTACK_SSM_URL=http://ssm \
  --set env.LOCALSTACK_SM_URL=http://secretsmanager \
  --set env.AWS_ACCESS_KEY_ID=foobar \
  --set env.AWS_SECRET_ACCESS_KEY=foobar \
  --set env.AWS_DEFAULT_REGION=us-east-1 \
  --set env.AWS_REGION=us-east-1 \
  --set env.POLLER_INTERVAL_MILLISECONDS=1000 \
  --set env.LOCALSTACK_STS_URL=http://sts | kubectl apply -f -

echo -e "${BGREEN}Granting permissions to external-secrets e2e service account...${NC}"
kubectl create serviceaccount external-secrets-e2e || true
kubectl create clusterrolebinding permissive-binding \
  --clusterrole=cluster-admin \
  --user=admin \
  --user=kubelet \
  --serviceaccount=default:external-secrets-e2e || true

until kubectl get secret | grep -q ^external-secrets-e2e-token; do \
  echo -e "waiting for api token"; \
  sleep 3; \
done

echo -e "${BGREEN}Starting external-secrets e2e tests...${NC}"
kubectl rollout status deploy/localstack
kubectl rollout status deploy/e2e-kubernetes-external-secrets

kubectl run \
  --attach \
  --restart=Never \
  --env="LOCALSTACK=true" \
  --env="LOCALSTACK_SSM_URL=http://ssm" \
  --env="LOCALSTACK_SM_URL=http://secretsmanager" \
  --env="AWS_ACCESS_KEY_ID=foobar" \
  --env="AWS_SECRET_ACCESS_KEY=foobar" \
  --env="AWS_DEFAULT_REGION=us-east-1" \
  --env="AWS_REGION=us-east-1" \
  --env="LOCALSTACK_STS_URL=http://sts" \
  --generator=run-pod/v1 \
  --overrides='{ "apiVersion": "v1", "spec":{"serviceAccountName": "external-secrets-e2e"}}' \
  e2e --image=external-secrets-e2e:test
