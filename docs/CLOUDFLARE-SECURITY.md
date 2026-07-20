# Cloudflare zone-level security & SEO checklist for malaikanest.com

These toggles sit on the Cloudflare **zone dashboard** (not in code). All of them
live behind your Cloudflare account, so this document tells you where to click
and what to enter. The next two screenshots from your account confirmed:

- Zone: `malaikanest.com`
- Account id: `bd1b4f0c742043ff7e670eda80c5175d`
- Zone id: `17a0cb2f45321d22617a79d0c5d9f0d6`

---

## 1. HSTS — `Domains without HSTS: 1`

Strict-Transport-Security is enforced at the **edge** when HSTS is enabled in
the Cloudflare dashboard. Our app code already sends the response header
(`next.config.ts` and `prod.py`), but the dashboard switch is required for
Cloudflare's "always-on" view to score the domain as hardened.

**Path:** SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)

Turn on:

- **Enable HSTS (Strict-Transport-Security)** — `ON`
- **Max-Age** — `12 months` (or longer if you want preloading)
- **Include Subdomains** — `ON`
- **Preload** — `ON` *only* once you are sure no subdomain serves plain HTTP
- **No-Sniff Header** — `ON`

Apply to **both** zones (the front `malaikanest.com` and the API
`api.malaikanest.com`). The probe should now read `Domains without HSTS: 0`.

## 2. Block AI bots + AI Labyrinth

Cloudflare rolled out "Block AI Bots" + "AI Labyrinth" to all paid + free zones
in 2025.

**Path:** Security → Bots → AI Bots

- **Block AI Bots / Scrapers** — `ON`
- **AI Labyrinth** — `ON`

AI Labyrinth returns infinite AI-generated filler pages to misbehaving AI
crawlers (GPTBot, ClaudeBot, Bytespider, etc.) while letting humans and
honest bots through. No effect on your real traffic.

## 3. Security.txt — `Security.txt not configured`

Already added at:
- `https://malaikanest.com/.well-known/security.txt`

Verify after the next frontend deploy by visiting the URL above. The dashboard
probe should now read `Security.txt configured`.

## 4. DMARC — `DMARC Record Error detected`

The probe checks your contact-email **domain**. Your admin contact is
`malaikanest7@gmail.com`. DMARC for gmail.com is **Google's to publish**, not
yours, but Google's record already exists at `gmail.com._dmarc.example`:

> gmail.com publishes:<br/>
> `v=DMARC1; p=reject; rua=mailto:mailauth-reports@google.com`

If the probe is still failing, it usually means **no DKIM** is configured on
the **sending** domain. Since Gmail already enforces DKIM, the issue is that
**another** sender uses your contact email — e.g. the python SMTP backend in
`backend/.env` (EMAIL_HOST_USER `malaikanest7@gmail.com`). That server **does
not** sign with Gmail DKIM, so DMARC alignment fails for outbound order
notifications.

Two ways to fix:

### A. Switch to a domain you own (recommended)

Use `orders@malaikanest.com` (or any address you control). Steps:

1. In Cloudflare DNS, add:
   ```
   TXT  @  "v=spf1 include:_spf.google.com ~all"
   TXT  google._domainkey  "<DKIM public key from your SMTP provider>"
   TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@malaikanest.com; ruf=mailto:dmarc@malaikanest.com; pct=100"
   ```
2. Update `backend/.env`:
   ```
   EMAIL_HOST_USER=orders@malaikanest.com
   ```
3. Sign with either Google Workspace SMTP relay (recommended) or a transactional
   provider (Postmark / Mailgun / SES) which provides DKIM + DMARC alignment
   out of the box.

### B. Stay on Gmail but warm-up

Send order notifications via the **Gmail API** (OAuth) instead of SMTP.
Gmail's API uses DKIM-signed mail from the user's mailbox, so DMARC alignment
succeeds. Heavy lift for one storefront — only choose this if you cannot get a
domain email yet.

The probe considers DMARC **fully passing** when both:
- a `v=DMARC1` TXT record exists on the **apex domain your email is on**, and
- outgoing mail is DKIM- or SPF-aligned.

If you stick with Gmail: open the contact address in gmail web → `Show original`
on the latest order email and confirm it shows
`dkim=pass header.d=gmail.com`. If the order SMTP returns
`dkim=none` or `dkim=fail`, the issue is the python SMTP backend, not gmail.

## 5. Allow-list trusted byes — optional polish

After fixing the above, the only remaining should be `Block AI bots not enabled`
and `AI Labyrinth not enabled` (item 2). The rest should go green.

---

## Quick verification checklist

```
✓ HSTS enabled in Cloudflare for malaikanest.com and api.malaikanest.com
✓ Block AI Bots ON
✓ AI Labyrinth ON
✓ /.well-known/security.txt returns 200 with the file we just committed
✓ DMARC — decide whether to switch to a domain email (A) or Gmail API (B)
```
