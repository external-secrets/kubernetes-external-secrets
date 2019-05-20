#!/bin/sh

LOCAL_HOSTNAME=$(hostname -d)

if [[ ${LOCAL_HOSTNAME} =~ .*\.amazonaws\.com ]]; then
  EC2_AVAIL_ZONE=`wget -q -O- http://169.254.169.254/latest/meta-data/placement/availability-zone || true`
  export AWS_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed 's/[a-z]$//'`"
fi
