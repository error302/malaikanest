## 2026-11-09 - SSRF Vulnerability in Product Image Download
**Vulnerability:** User-controlled `image_url` was directly passed to `requests.get()` in `_download_image` methods of product serializers, allowing Server-Side Request Forgery (SSRF).
**Learning:** External URL fetching inside serializers must always validate the hostname against a whitelist, enforce secure protocols (HTTPS), and prevent automatic redirection.
**Prevention:** Use `urlparse` to check the hostname against an allowed list (e.g. `IMAGE_URL_ALLOWED_HOSTS`), enforce `scheme == "https"`, and set `allow_redirects=False` in `requests.get()`.
