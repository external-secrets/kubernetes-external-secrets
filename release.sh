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

docker build -t godaddy/kubernetes-external-secrets:$SHA .
docker tag godaddy/kubernetes-external-secrets:$SHA godaddy/kubernetes-external-secrets:$TAG
docker tag godaddy/kubernetes-external-secrets:$SHA godaddy/kubernetes-external-secrets:latest

perl -i -pe "s/image: ([^:]*):[a-zA-Z0-9\.]*/image: \1:$TAG/" ./external-secrets.yml

echo ""
echo "Do the following to publish:"
echo ""
echo "  1. inspect local changes (e.g., git status, git diff)"
echo "  2. git add --all && git commit -m \"chore(release): godaddy/kubernetes-external-secrets:$TAG\""
echo "  2. git push --follow-tags origin master && docker push godaddy/kubernetes-external-secrets:$TAG && docker push godaddy/kubernetes-external-secrets:latest"
echo ""
