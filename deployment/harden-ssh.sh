#!/bin/bash
set -euo pipefail

# Usage:
# sudo SSH_ALLOW_CIDR="203.0.113.0/24" ALLOW_USER="mohameddosho20" bash harden-ssh.sh

SSH_CONFIG="/etc/ssh/sshd_config"
ALLOW_USER="${ALLOW_USER:-}"

if [ ! -f "$SSH_CONFIG" ]; then
  echo "sshd_config not found"
  exit 1
fi

cp "$SSH_CONFIG" "${SSH_CONFIG}.bak.$(date +%s)"

sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSH_CONFIG"
sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "$SSH_CONFIG"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"

if [ -n "$ALLOW_USER" ]; then
  if grep -q '^AllowUsers' "$SSH_CONFIG"; then
    sed -i "s/^AllowUsers.*/AllowUsers $ALLOW_USER/" "$SSH_CONFIG"
  else
    echo "AllowUsers $ALLOW_USER" >> "$SSH_CONFIG"
  fi
fi

sshd -t
systemctl restart ssh || systemctl restart sshd
systemctl status ssh --no-pager || systemctl status sshd --no-pager