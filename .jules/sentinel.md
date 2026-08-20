## 2026-08-10 - SSRF via Open Redirects in Invoice PDFs
**Vulnerability:** In `apps.orders.views`, when fetching remote Cloudinary PDF files, the `requests.get` call lacked `allow_redirects=False`. This allowed an attacker to upload an image to Cloudinary that returned a 302 redirect pointing to internal services (e.g., `169.254.169.254`), bypassing the `allowed_hosts` check.
**Learning:** Checking the domain of a URL via `urlparse` before fetching it is insufficient if the HTTP client follows redirects by default. The attacker can host a payload on an allowed domain that redirects to a protected internal resource.
**Prevention:** Always pass `allow_redirects=False` to `requests.get` when fetching external user-supplied or partially-user-controlled URLs.

## 2026-08-10 - IP Spoofing in Admin Log Endpoint
**Vulnerability:** The `Pm2LogsView` manually parsed `HTTP_X_FORWARDED_FOR` using `x_forwarded_for.split(',')[0].strip()` (the left-most IP), allowing any client to bypass the `LOGS_ALLOWED_IPS` list by simply injecting a spoofed internal IP in the header.
**Learning:** Trusting the left-most IP in `X-Forwarded-For` is fundamentally insecure as it is entirely client-controlled.
**Prevention:** Always use the centralized `get_client_ip` function in `apps.accounts.security` to extract the client IP, which correctly uses `X-Real-IP` or the right-most (proxy-appended) IP from `X-Forwarded-For`.

## 2024-05-18 - [Fix XSS via dangerouslySetInnerHTML in Next.js SSR]
**Vulnerability:** User-generated blog content was injected directly into the DOM using `dangerouslySetInnerHTML` in `frontend/src/app/(store)/blog/[slug]/page.tsx` without sanitization, leading to an XSS vulnerability.
**Learning:** This codebase uses Next.js server-side rendering (SSR). Standard `dompurify` cannot be used as it fails during SSR due to missing browser APIs (like `window`). A specific library, `isomorphic-dompurify`, must be used to ensure sanitization works both on the server and the client.
**Prevention:** Always wrap variables passed to `dangerouslySetInnerHTML={{ __html: ... }}` with `DOMPurify.sanitize()` from `isomorphic-dompurify`, especially when rendering potentially untrusted user content like blog markdown.

## 2024-05-20 - SSRF Vulnerability in Admin Image Downloads
**Vulnerability:** In `apps.products.admin_serializers.py`, the `_download_image` methods fetched user-supplied URLs using `requests.get` without any validation of the scheme or hostname, creating a Server-Side Request Forgery (SSRF) vulnerability. This allowed admins or attackers with admin privileges to make the server fetch internal resources.
**Learning:** Fetching external resources directly from user-supplied URLs without an allowlist is inherently unsafe, even in an admin context.
**Prevention:** Always parse user-supplied URLs using `urllib.parse.urlparse`, explicitly validate the scheme (e.g., `http`, `https`), check the hostname against a strict allowlist (e.g., via Django settings), and pass `allow_redirects=False` to `requests.get` to prevent redirect-based bypasses.
