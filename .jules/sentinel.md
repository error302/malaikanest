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

## 2026-09-10 - SSRF via Open Redirects in Admin Product & Category Serializers
**Vulnerability:** In `apps.products.admin_serializers.py`, when fetching remote image URLs during product or category creation/update via `_download_image()`, the `requests.get` call lacked validation of the URL scheme, lacked an allowed host check, and lacked `allow_redirects=False`. This allowed an attacker to supply a URL that redirects to internal services (e.g., `http://169.254.169.254` or internal subnets), leading to Server-Side Request Forgery (SSRF).
**Learning:** All internal methods that fetch external, user-supplied URLs must perform rigorous validation, regardless of where they are called (e.g., admin serializers vs. public views). Specifically, `urlparse` should be used to enforce the `https` scheme and restrict the hostname against an allowlist (like `IMAGE_URL_ALLOWED_HOSTS`), AND `requests.get` must have `allow_redirects=False` to prevent bypassing via 301/302 redirects.
**Prevention:** Always implement a two-pronged SSRF defense for outbound HTTP requests: strictly validate the parsed URL scheme and hostname against an allowlist, AND pass `allow_redirects=False` to the HTTP client.
