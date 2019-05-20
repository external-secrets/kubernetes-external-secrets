#!/bin/sh

# Use EC2 instance metadata to get the region https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html
EC2_AVAIL_ZONE=`wget -q -O- http://169.254.169.254/latest/meta-data/placement/availability-zone || true`
export AWS_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed 's/[a-z]$//'`"
