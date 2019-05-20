#!/bin/sh

export AWS_REGION=$(wget -q -O - http://169.254.169.254/latest/dynamic/instance-identity/document | grep '\"region\"' | cut -d\" -f4)
npm start
