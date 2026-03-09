#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXCLUDE_FILE="${ROOT_DIR}/deployment/sync-exclude.txt"

# Override these when needed:
# REMOTE_HOST='user@ip' REMOTE_DIR='/var/www/malaikanest' SSH_KEY='~/.ssh/key' ./deployment/sync-code-only.sh
REMOTE_HOST="${REMOTE_HOST:-mohameddosho20@104.154.161.10}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/malaikanest}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/MalaikaNestKey}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not installed."
  exit 1
fi

if [[ ! -f "${EXCLUDE_FILE}" ]]; then
  echo "Missing exclude file: ${EXCLUDE_FILE}"
  exit 1
fi

RSYNC_ARGS=(
  -az
  --delete
  --exclude-from "${EXCLUDE_FILE}"
)

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
fi

echo "Syncing code to ${REMOTE_HOST}:${REMOTE_DIR}"
rsync "${RSYNC_ARGS[@]}" -e "ssh -i ${SSH_KEY}" "${ROOT_DIR}/" "${REMOTE_HOST}:${REMOTE_DIR}/"
echo "Sync complete. Secrets and excluded runtime paths were preserved."
