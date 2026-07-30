#!/usr/bin/env bash
# check_email_dns.sh — Verify SPF, DKIM, and DMARC DNS records
# for Malaika Nest email deliverability.
#
# Usage: bash deployment/check_email_dns.sh
#
# Prerequisites: dig (bind9-dnsutils) or nslookup

set -euo pipefail

DOMAIN="${1:-malaikanest.com}"
BREVO_DKIM_SELECTOR="${2:-brevo}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }

echo
echo "═══════════════════════════════════════════════════"
echo "  Email DNS Record Check — ${DOMAIN}"
echo "═══════════════════════════════════════════════════"
echo

# ── MX Records ──────────────────────────────────────────
echo "── MX Records ──"
MX=$(dig +short MX "$DOMAIN" 2>/dev/null || nslookup -type=MX "$DOMAIN" 2>/dev/null | grep "mail exchanger" | awk '{print $NF}')
if [ -n "$MX" ]; then
  pass "MX records found:"
  echo "$MX" | while IFS= read -r line; do echo "     $line"; done
else
  fail "No MX records found! Email cannot be delivered."
fi
echo

# ── SPF Record ──────────────────────────────────────────
echo "── SPF Record ──"
SPF=$(dig +short TXT "$DOMAIN" 2>/dev/null | grep -i "v=spf1" || nslookup -type=TXT "$DOMAIN" 2>/dev/null | grep "v=spf1" | grep -o '".*"' | tr -d '"')
if [ -n "$SPF" ]; then
  pass "SPF record found:"
  echo "     $SPF"
  if echo "$SPF" | grep -qi "include:brevo\|include:sendinblue\|include:spf.brevo.com"; then
    pass "Brevo/ Sendinblue is included in SPF."
  else
    warn "Brevo/ Sendinblue NOT found in SPF. Add: include:spf.brevo.com"
  fi
  if echo "$SPF" | grep -qi "~all\|-all"; then
    pass "SPF has a hard/soft fail mechanism (~all or -all)."
  else
    fail "SPF lacks ?all/~all/-all mechanism — anyone can spoof your domain."
  fi
else
  fail "No SPF record found! Add: v=spf1 include:spf.brevo.com ~all"
fi
echo

# ── DKIM Record ─────────────────────────────────────────
echo "── DKIM Record ──"
DKIM=$(dig +short TXT "${BREVO_DKIM_SELECTOR}._domainkey.${DOMAIN}" 2>/dev/null || nslookup -type=TXT "${BREVO_DKIM_SELECTOR}._domainkey.${DOMAIN}" 2>/dev/null | grep "v=DKIM1" | grep -o '".*"' | tr -d '"')
if [ -n "$DKIM" ]; then
  pass "DKIM record found (selector: ${BREVO_DKIM_SELECTOR}):"
  echo "     ${DKIM:0:80}..."
else
  fail "No DKIM record found for selector '${BREVO_DKIM_SELECTOR}'."
  warn "Check your Brevo dashboard: Advanced Settings → DKIM for the correct selector."
  warn "Typical format: brevo._domainkey.${DOMAIN} → v=DKIM1; p=<public-key>"
fi
echo

# ── DMARC Record ────────────────────────────────────────
echo "── DMARC Record ──"
DMARC=$(dig +short TXT "_dmarc.${DOMAIN}" 2>/dev/null || nslookup -type=TXT "_dmarc.${DOMAIN}" 2>/dev/null | grep "v=DMARC1" | grep -o '".*"' | tr -d '"')
if [ -n "$DMARC" ]; then
  pass "DMARC record found:"
  echo "     $DMARC"
  if echo "$DMARC" | grep -qi "p=reject\|p=quarantine"; then
    pass "DMARC policy is ${DMARC#*p=} (reject/quarantine — good)."
  else
    warn "DMARC policy is none (p=none) — consider p=quarantine or p=reject."
  fi
else
  fail "No DMARC record found. Add: v=DMARC1; p=quarantine; rua=mailto:hello@${DOMAIN}"
fi
echo

# ── Summary ─────────────────────────────────────────────
echo "────────────────────────────────────────────────────"
echo
SPF_OK="✗"; [ -n "$SPF" ] && SPF_OK="✓"
DKIM_OK="✗"; [ -n "$DKIM" ] && DKIM_OK="✓"
DMARC_OK="✗"; [ -n "$DMARC" ] && DMARC_OK="✓"
echo "  SPF:  ${SPF_OK}     DKIM: ${DKIM_OK}     DMARC: ${DMARC_OK}"
echo
echo "For Brevo (Sendinblue), configure at:"
echo "  https://app.brevo.com/senders/domain/${DOMAIN}"
echo
echo "Required records for Brevo delivery:"
echo "  1. MX → mx.brevo.com (or your mail provider)"
echo "  2. TXT @ → v=spf1 include:spf.brevo.com ~all"
echo "  3. TXT brevo._domainkey.${DOMAIN} → v=DKIM1; p=<key-from-brevo>"
echo "  4. TXT _dmarc.${DOMAIN} → v=DMARC1; p=quarantine; rua=mailto:hello@${DOMAIN}"
echo
