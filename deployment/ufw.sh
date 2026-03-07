#!/bin/bash
set -euo pipefail

# Harden UFW with strict SSH allowlist support.
SSH_ALLOW_CIDR="${SSH_ALLOW_CIDR:-}"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

if [ -n "$SSH_ALLOW_CIDR" ]; then
  ufw allow from "$SSH_ALLOW_CIDR" to any port 22 proto tcp
else
  # Fallback only if explicit allowlist is not provided.
  ufw allow OpenSSH
fi

ufw allow 80/tcp
ufw allow 443/tcp

# Never expose backend ports publicly.
ufw deny 3000/tcp || true
ufw deny 8000/tcp || true
ufw deny 8001/tcp || true

ufw --force enable
ufw status verbose