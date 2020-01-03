#!/usr/bin/env bash

npm test
npm run test-e2e
helm lint charts/kubernetes-external-secrets
