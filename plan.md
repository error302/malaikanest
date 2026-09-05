1. **Fix SSRF vulnerability in AdminCategorySerializer._download_image**
   - Add a check to validate that the URL scheme is `https` and the hostname is in `IMAGE_URL_ALLOWED_HOSTS` (defaulting to `["res.cloudinary.com", "cloudinary.com"]`).
   - Add `allow_redirects=False` to the `requests.get` call to prevent open redirects.
2. **Fix SSRF vulnerability in AdminProductSerializer._download_image**
   - Add the same URL scheme and hostname validation.
   - Add `allow_redirects=False` to `requests.get`.
   - Fix a small bug in the exception handling where it references `url` instead of `image_url`.
3. **Run tests**
   - Run backend tests to verify that these changes don't break existing functionality and the codebase is secure.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the PR**
   - Create a PR with a description explaining the SSRF fix.
