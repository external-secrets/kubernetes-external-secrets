#!/bin/sh

set -e

cd /app
chown node:node /app
exec su-exec alone "$@"
