## 2026-11-08 - SSRF in Admin Image Download
**Vulnerability:** The `AdminCategorySerializer` and `AdminProductSerializer` in `apps.products` fetched user-provided image URLs (e.g. from Cloudinary) using `requests.get()` without checking the hostname, without enforcing HTTPS, and without disabling redirects.
**Learning:** Even internal admin tools must treat user-supplied URLs defensively to prevent Server-Side Request Forgery, where an attacker could use the server to probe internal networks (e.g. `http://169.254.169.254/`).
**Prevention:** Always validate the parsed URL hostname against an allowlist, enforce HTTPS, and strictly pass `allow_redirects=False` to HTTP requests to avoid Open Redirect bypasses.
