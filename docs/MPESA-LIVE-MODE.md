# Switching M-Pesa to live mode

When you're ready to accept real M-Pesa Paybill payments on malaikanest.com:

## 1. Get the production passkey
- Log in to https://developer.safaricom.co.ke/daraja-portal
- Open your **Paybill / Till app** (shortcode **3104615**)
- Under the app, generate (or copy) the **Production Passkey** — it is **not** the same as the sandbox `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` value currently in `backend/.env`. Treat this value as a secret.

## 2. Update `backend/.env`
Open `backend/.env` and change these three lines:
```
MPESA_ENV=production
MPESA_MOCK_MODE=false
MPESA_PASSKEY=<paste the real production passkey from step 1>
```
Leave everything else (`MPESA_SHORTCODE`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_CALLBACK_URL`, etc.) untouched.

## 3. Confirm cell number on Daraja (one-time, prevents invalid-initiator locks)
While logged in, make sure your phone number is registered against the Passkey/Credential so the test STK push below doesn't get rejected.

## 4. Restart the backend so a new `MPESA_PASSKEY` is read
Run from `C:\Users\user\Desktop\malaikanest`:
```
docker compose up -d --force-recreate backend celery_worker celery_beat cloudflared
```
(`backend/.env` is mounted at container start; no rebuild needed — `MPESA_PASSKEY` is read by the Daraja client on every STK push, but the worker/beat holding old certificate caches also need a refresh.)

## 5. Smoke-test with a small STK push
- Open `https://malaikanest.com`, add a cheap test product to cart, proceed to checkout, choose **M-Pesa**.
- Enter your own real M-Pesa number (the one registered on the passkey) for a tiny amount (Ksh 1 is fine if your Daraja app allows; otherwise the cart's smallest item).
- You should receive an STK prompt on your phone. Approve it.
- Watch the orders page for the state to flip to **Paid** via the callback.

If you instead see **INVALID_INITIATOR_CREDENTIALS**, **Invalid Passkey** (`400 BL/SF/HS400`), or **Bad Request - Invalid Access Token**:
- Step 1 — re-copy the passkey from the Daraja portal, no extra whitespace.
- Step 2 — confirm `MPESA_ENV=production` (Daraja rejects sandbox keys against the production endpoint and vice versa).
- Step 3 — confirm your number is the one registered for the passkey.

## 6. (Optional) verify the public key if signature pinning is enabled
If `MPESA_STRICT_SIGNATURE=true` and the IPC/Daraja signature verification later fails, refresh `MPESA_PUBLIC_KEY_PATH` with the current Safaricom public cert from their docs and rebuild **backend + worker**:
```
docker compose build backend celery_worker celery_beat
docker compose up -d --force-recreate backend celery_worker celery_beat
```

## 7. Rollback
If something goes wrong, revert by setting `MPESA_MOCK_MODE=true` in `backend/.env` and restarting only `backend celery_worker celery_beat` — checkout will treat STK as instantaneously successful and the orders table stays consistent.

## Important reminders
- `backend/.env` is in `.gitignore` (good — never commit it).
- All other Daraja values are already correct (`MPESA_SHORTCODE=3104615`, callback URL, consumer key/secret, public key, etc.).
- Keep using https only — Daraja rejects http callbacks.
