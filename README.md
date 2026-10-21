# Viral Content Accelerator

Static landing page for One Peak Creative's Viral Content Accelerator. The site
is plain HTML, CSS, and vanilla JavaScript — no build step and no runtime
dependencies.

## Files

- `index.html` — the landing page
- `styles.css` — site styles
- `script.js` — interactions (navigation, carousel, pricing, analytics hooks)
- `config.js` — enrollment and analytics configuration
- `assets/` — fonts, images, and brand icons referenced by the page
- `robots.txt`, `site.webmanifest` — crawler and PWA metadata
- `_headers` — security and cache headers applied by Workers static assets

Photography and brand assets were sourced from One Peak Creative's public site.
Confirm usage rights with the brand before a public launch.

## Deployment

Deploy the repository root as Workers static assets:

```sh
npx wrangler deploy --assets .
```

The `.assetsignore` file excludes `.git`, `node_modules`, Python tooling, and
other non-runtime files from the upload. This is required because Cloudflare's
build environment installs Wrangler and its `workerd` binary into
`node_modules`; without the ignore list Wrangler tries to upload that 134 MiB
binary as a public asset and the deploy fails Cloudflare's 25 MiB per-asset
limit.
