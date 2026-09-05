## 2024-05-30 - [SSRF Bypass in Image Fetching]
**Vulnerability:** Found `requests.get(image_url)` inside `AdminCategorySerializer` and `AdminProductSerializer` without explicitly restricting `allow_redirects`.
**Learning:** Even if a URL scheme and hostname are verified against an allow-list prior to fetching, an attacker can use a valid host (e.g., Cloudinary) that performs an open redirect (301/302) to an internal IP or metadata endpoint. The standard `requests.get` will silently follow redirects by default, thereby bypassing the initial validation.
**Prevention:** When fetching remote URLs, in addition to validating the scheme and host, always enforce `allow_redirects=False` to prevent the HTTP client from following redirects to unchecked locations.
