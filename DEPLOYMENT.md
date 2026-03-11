# Deployment (e.g. Hostinger)

## Image quality looks bad on the live site

Hostinger can compress or resize images when **CDN / image optimization** is enabled, so photos look fine locally but worse after deploy.

**Fix:** In **hPanel** go to **CDN** (or **Website → Optimization**) and:

1. **Turn off “Smart image optimization”** (or “Image optimization”) so images are not resized or recompressed.
2. Optionally turn off **“WebP image compression”** if you want to serve the original JPEGs as-is.

After changing these, clear the CDN cache (or wait for it to refresh) and hard-refresh the site (Ctrl+F5).

---

## Fonts or page fades not working on Hostinger

- **Fonts:** The site loads Google Fonts via an early `<link>` in the head. If fonts still don’t apply sometimes, try clearing the Hostinger cache and your browser cache, or test in a private window. For 100% reliability you can self-host the font files (e.g. from [google-webfonts-helper](https://gwfh.mranftl.com/fonts)) and add `@font-face` in your CSS.
- **Fades:** Page-to-page fade and gallery fade-in need `main.js` to load. If fades never work on the live site:
  1. In the browser, open DevTools → Network and reload. Check that `main.js?v=4.0` (or the current version) returns 200, not 404.
  2. Clear Hostinger’s cache and your browser cache so the latest JS is served.
  3. If the site lives in a subfolder, ensure the script path is correct (e.g. `../assets/js/main.js` for pages in a subfolder).

---

The site uses the same image files locally and on the server; quality loss is almost always from the host’s automatic image optimization.
