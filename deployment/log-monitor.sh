#!/bin/bash
set -euo pipefail

SECURITY_LOG="${SECURITY_LOG:-/home/mohameddosho20/malaikanest/backend/logs/security.log}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
WINDOW_MINUTES="${WINDOW_MINUTES:-10}"
THRESHOLD="${THRESHOLD:-20}"

if [ ! -f "$SECURITY_LOG" ]; then
  echo "Security log not found: $SECURITY_LOG"
  exit 0
fi

recent_count=$(awk -v mins="$WINDOW_MINUTES" '
  BEGIN { cmd = "date -u +%s"; cmd | getline now; close(cmd); }
  {
    # log format includes timestamp as second token: YYYY-MM-DD HH:MM:SS,mmm
    d=$2" "$3
    gsub(",", ".", d)
    cmd = "date -u -d \"" d "\" +%s 2>/dev/null"
    cmd | getline ts
    close(cmd)
    if (ts > 0 && (now - ts) <= (mins * 60) && $0 ~ /AUTH_EVENT/ && $0 ~ /login_failed|login_blocked_locked|captcha_failed/) c++
  }
  END { print c+0 }
' "$SECURITY_LOG")

if [ "$recent_count" -ge "$THRESHOLD" ]; then
  msg="MalaikaNest security alert: $recent_count auth failures in last $WINDOW_MINUTES minutes"
  echo "$msg"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-Type: application/json' -d "{\"text\":\"$msg\"}" "$ALERT_WEBHOOK" >/dev/null || true
  fi
fi