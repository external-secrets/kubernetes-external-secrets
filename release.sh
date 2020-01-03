#!/bin/sh

set -e

if [ -z "$ALLOW_DIRTY" ]; then
    if ! output=$(git status --porcelain) || ! [ -z "$output" ]; then
        git status
        echo ""
        echo "Ensure working directory is clean before releasing."
        echo ""
        exit 1
    fi
fi

SHA=$(git rev-parse --short HEAD)
TAG=$(git describe)

perl -i -pe "s/kubernetes-external-secrets Image tag \| \`[a-zA-Z0-9\.]*/kubernetes-external-secrets Image tag \| \`$TAG/" charts/kubernetes-external-secrets/README.md
perl -i -pe "s/tag: [a-zA-Z0-9\.]*/tag: $TAG/" charts/kubernetes-external-secrets/values.yaml
perl -i -pe "s/appVersion: [a-zA-Z0-9\.]*/appVersion: $TAG/" charts/kubernetes-external-secrets/Chart.yaml
perl -i -pe "s/version: [a-zA-Z0-9\.]*/version: $TAG/" charts/kubernetes-external-secrets/Chart.yaml
#(cd charts/kubernetes-external-secrets && helm package . && helm repo index --merge ../../docs/index.yaml ./ && mv *.tgz ../../docs && mv index.yaml ../../docs)
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
docker build -t pearsontechnology/kubernetes-external-secrets:$SHA .
docker tag pearsontechnology/kubernetes-external-secrets:$SHA pearsontechnology/kubernetes-external-secrets:$TAG
docker tag pearsontechnology/kubernetes-external-secrets:$SHA pearsontechnology/kubernetes-external-secrets:latest
docker push pearsontechnology/kubernetes-external-secrets:$TAG
docker push pearsontechnology/kubernetes-external-secrets:latest

#echo ""
#echo "Do the following to publish:"
#echo ""
#echo "  1. inspect local changes (e.g., git status, git diff)"
#echo "  2. git add --all && git commit -m \"chore(release): godaddy/kubernetes-external-secrets:$TAG\""
#echo "  3. git push --follow-tags origin master && docker push godaddy/kubernetes-external-secrets:$TAG && docker push godaddy/kubernetes-external-secrets:latest"
#echo ""
