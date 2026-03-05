#!/bin/bash
# Duck DNS Update Script
# Auto-updates IP every 30 minutes

DOMAIN="malaikanest"
TOKEN="6c3321a8-808e-4132-bf8b-122f8dc56610"
IP=$(curl -s ifconfig.me)

# Update Duck DNS
curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=${IP}"

echo "Duck DNS updated for ${DOMAIN} to IP ${IP}"
