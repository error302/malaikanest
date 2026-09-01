## 2024-05-17 - SSRF via Admin Image Download

**Vulnerability:** Found an SSRF vulnerability in the Django admin serializers (`AdminCategorySerializer`, `AdminProductSerializer`) where `requests.get()` was used to download images from user-supplied URLs without verifying the hostname or disabling redirects.

**Learning:** When fetching remote URLs in a Django backend, standard Python `requests.get()` calls without `allow_redirects=False` and strict host validation can easily be bypassed to access internal resources. The codebase had some SSRF protections in other areas (e.g., invoice generation), but these custom image downloader methods in admin serializers lacked them.

**Prevention:** Always use a two-pronged approach when fetching remote URLs: 1) strictly validate the URL scheme ('https') and ensure the hostname is in an allowlist (e.g., `IMAGE_URL_ALLOWED_HOSTS`), AND 2) explicitly pass `allow_redirects=False` to `requests.get()` to prevent attackers from bypassing host validation via open redirects.
