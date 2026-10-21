## 2024-08-23 - [SSRF in Admin Serializers]
**Vulnerability:** The application was using `requests.get()` in `AdminCategorySerializer` and `AdminProductSerializer` to download remote images based on user-supplied URLs without verifying the hostname, exposing the server to Server-Side Request Forgery (SSRF) vulnerabilities.
**Learning:** Even internal admin tools must restrict outward HTTP requests. In Django, using `requests.get` to fetch media without allowlists can lead to SSRF, allowing attackers to scan internal networks or exfiltrate metadata.
**Prevention:** Always validate the URL scheme (e.g., 'https') and ensure the hostname is in a strict allowlist (e.g., from Django settings) before executing HTTP requests. Do not rely solely on `allow_redirects=False`.
