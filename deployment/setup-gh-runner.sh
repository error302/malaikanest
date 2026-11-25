#!/usr/bin/env bash
# setup-gh-runner.sh
# Run this ONCE on the GCP VM as the deployment user (mohameddosho20).
# It installs a GitHub Actions self-hosted runner that polls GitHub outbound,
# so port 22 stays locked down and no inbound SSH is needed from GitHub.
#
# Usage:
#   GH_TOKEN=<your-token> bash deployment/setup-gh-runner.sh
#
# How to get GH_TOKEN:
#   1. Go to https://github.com/error302/malaikanest/settings/actions/runners
#   2. Click "New self-hosted runner" → Linux → x64 (or ARM64 if Oracle A1)
#   3. Copy the token shown in the "Configure" section (not the full curl command)
#   4. That token is your GH_TOKEN (it's short-lived, ~1 hour)
#
# After running this script, the runner registers itself under the label
# "malaikanest" and starts as a systemd service. All future pushes to main
# will deploy automatically without any inbound SSH.

set -euo pipefail

REPO="error302/malaikanest"
RUNNER_NAME="${RUNNER_NAME:-malaikanest-vm}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,malaikanest}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
RUNNER_VERSION="2.338.2"   # GitHub enforces a minimum runner version (2.329+ as of 2026-02)

GH_TOKEN="${GH_TOKEN:-}"
if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: Set GH_TOKEN to your Actions runner registration token."
  echo "Get one at: https://github.com/${REPO}/settings/actions/runners/new"
  exit 1
fi

# ── Detect architecture ────────────────────────────────────────────────────
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  RUNNER_ARCH="x64" ;;
  aarch64) RUNNER_ARCH="arm64" ;;
  *)       echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

RUNNER_PKG="actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_PKG}"

# ── Download runner ────────────────────────────────────────────────────────
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f "$RUNNER_PKG" ]; then
  echo "[1/4] Downloading runner ${RUNNER_VERSION} (${RUNNER_ARCH})..."
  curl -fsSL -o "$RUNNER_PKG" "$RUNNER_URL"
fi

echo "[2/4] Extracting..."
tar xzf "$RUNNER_PKG"

# ── Configure runner ───────────────────────────────────────────────────────
echo "[3/4] Configuring runner for ${REPO}..."
./config.sh \
  --url "https://github.com/${REPO}" \
  --token "$GH_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "_work" \
  --unattended \
  --replace

# ── Install as systemd service ─────────────────────────────────────────────
echo "[4/4] Installing systemd service..."
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status

echo ""
echo "✓ Runner '${RUNNER_NAME}' registered and running."
echo "  Labels: ${RUNNER_LABELS}"
echo ""
echo "Verify at: https://github.com/${REPO}/settings/actions/runners"
echo ""
echo "Future deploys will run automatically on every push to main."
echo "No inbound SSH from GitHub is required — the runner polls GitHub outbound."
