#!/bin/sh

set -e

SHA=$(git rev-parse --short HEAD)
TAG=$(git describe)

docker build -t godaddy/kubernetes-external-secrets:$SHA .
docker tag godaddy/kubernetes-external-secrets:$SHA godaddy/kubernetes-external-secrets:$TAG

sed -i "s/godaddy\/kubernetes-external-secrets:[a-zA-Z0-9\.]*/godaddy\/kubernetes-external-secrets:$TAG/" external-secrets.yml
git commit external-secrets.yml -m "chore(release): godaddy/kubernetes-external-secrets:$TAG"

echo ""
echo "Run the following to publish:"
echo ""
echo "  git push --follow-tags origin master && docker push godaddy/kubernetes-external-secrets:$TAG"
echo ""
