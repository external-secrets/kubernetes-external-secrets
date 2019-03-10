#!/bin/sh

set -e

status=$(git status --porcelain)
if [ "$status" != "" ]; then
    echo 'Stash or remove changes and untracked files before publishing a new image.'
    exit 1
fi

TAG=$(git rev-parse --short HEAD)
docker build -t godaddy/kubernetes-external-secrets:$TAG .

sed -i "s/godaddy\/kubernetes-external-secrets:[a-zA-Z0-9]*/godaddy\/kubernetes-external-secrets:$TAG/" external-secrets.yml
git commit external-secrets.yml -m "chore(release): godaddy/kubernetes-external-secrets:$TAG"

echo ""
echo "Finishing by pushing godaddy/kubernetes-external-secrets:$TAG and external-secrets.yml:"
echo ""
echo "docker push godaddy/kubernetes-external-secrets:$TAG && git push origin master"
