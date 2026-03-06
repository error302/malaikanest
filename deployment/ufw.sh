#!/bin/bash
# Basic UFW setup for Ubuntu 22.04
set -euo pipefail

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Do NOT expose backend directly unless explicitly enabled.
if [ "${ALLOW_DIRECT_BACKEND:-false}" = "true" ]; then
  ufw allow from ${BACKEND_ALLOW_FROM:-127.0.0.1} to any port 8000 proto tcp
fi

ufw --force enable
