# Deployment (e.g. Hostinger)

## Image quality looks bad on the live site

Hostinger can compress or resize images when **CDN / image optimization** is enabled, so photos look fine locally but worse after deploy.

**Fix:** In **hPanel** go to **CDN** (or **Website → Optimization**) and:

1. **Turn off “Smart image optimization”** (or “Image optimization”) so images are not resized or recompressed.
2. Optionally turn off **“WebP image compression”** if you want to serve the original JPEGs as-is.

After changing these, clear the CDN cache (or wait for it to refresh) and hard-refresh the site (Ctrl+F5).

---

The site uses the same image files locally and on the server; quality loss is almost always from the host’s automatic image optimization.
