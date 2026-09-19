## 2024-05-24 - SSRF in admin serializers
**Vulnerability:** Admin serializers were using `requests.get` to download image URLs without properly validating the URL schema and host and following redirects.
**Learning:** `IMAGE_URL_ALLOWED_HOSTS` should always be strictly checked for exact domains against incoming external URLs prior to making requests to prevent Server-Side Request Forgery.
**Prevention:** Use a scheme check, hostname validation against an allowlist, and `allow_redirects=False` for all outgoing URL fetches.
