#!/usr/bin/env bash
# Installer script to copy systemd unit files and enable timers/services
# Usage: sudo ./install_systemd.sh /path/to/repo deploy_user

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 REPO_DIR SERVICE_USER"
  exit 2
fi

REPO_DIR="$1"
SERVICE_USER="$2"

echo "Installing systemd units for malaika_nest"
echo "Repo dir: $REPO_DIR"
echo "Service user: $SERVICE_USER"

UNIT_SRC_DIR="$REPO_DIR/deployment/systemd"
if [ ! -d "$UNIT_SRC_DIR" ]; then
  echo "Unit files not found in $UNIT_SRC_DIR"
  exit 1
fi

TMP_DIR=$(mktemp -d)
cp "$UNIT_SRC_DIR"/* "$TMP_DIR"/

# Replace placeholders in copied files (/home/ubuntu/malaika_nest and User=ubuntu)
find "$TMP_DIR" -type f -name "malaika_nest-*" -print0 | while IFS= read -r -d $'\0' f; do
  sed -i "s|/home/ubuntu/malaika_nest|${REPO_DIR}|g" "$f" || true
  sed -i "s|User=ubuntu|User=${SERVICE_USER}|g" "$f" || true
done

echo "Copying unit files to /etc/systemd/system/"
sudo cp "$TMP_DIR"/malaika_nest-* /etc/systemd/system/

echo "Copying helper scripts to /usr/local/bin/"
sudo cp "$REPO_DIR"/deployment/healthcheck.sh /usr/local/bin/malaika_healthcheck.sh
sudo cp "$REPO_DIR"/deployment/renew_certs.sh /usr/local/bin/malaika_renew_certs.sh
sudo chmod +x /usr/local/bin/malaika_healthcheck.sh /usr/local/bin/malaika_renew_certs.sh

sudo systemctl daemon-reload
sudo systemctl enable --now malaika_nest-health.timer
sudo systemctl enable --now malaika_nest-renew.timer

echo "Enabled timers. Status:"
sudo systemctl status malaika_nest-health.timer --no-pager || true
sudo systemctl status malaika_nest-renew.timer --no-pager || true

rm -rf "$TMP_DIR"
echo "Installation complete. Edit unit files in /etc/systemd/system if needed."
