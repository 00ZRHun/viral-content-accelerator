# Viral Content Accelerator

Static landing page for One Peak Creative's Viral Content Accelerator. The site
is plain HTML, CSS, and vanilla JavaScript — no build step and no runtime
dependencies.

## Page structure

The funnel is a single scroll with anchored navigation:

1. **Hero** — positioning, primary and secondary CTAs, platform coverage, social
   proof, Meg Jackson portrait, and the 1M-view guarantee seal.
2. **Program** — the weekly rhythm card plus six benefit cards
   (`#program`).
3. **Curriculum** — coaching, Format Finder, reviews, monetization, community,
   and the nine included courses (`#curriculum`).
4. **Results** — member statistics, a six-story carousel, and an Amazon quote
   (`#results`).
5. **Process** — the five-step creation loop (`#process`).
6. **Qualification** — "This works when you do," with for-you / not-for-you
   lists (`#fit`).
7. **Pricing** — full-payment and four-month plan toggle, guarantee, and
   enrollment links (`#enroll`).
8. **FAQ** — nine common questions (`#faq`).
9. **Final CTA** — closing pitch with price summary (`#join`).

On screens up to 700px, a sticky join bar appears after the opening pitch and
hides while the enrollment, final CTA, or footer is in view.

## Files

- `index.html` — page markup, metadata, JSON-LD, and inline SVG icons
- `styles.css` — all site styles and responsive breakpoints
- `script.js` — menu, scroll state, pricing toggle, carousel, reveal effects,
  sticky CTA, and analytics events
- `config.js` — enrollment URLs and analytics configuration
- `assets/` — fonts, images, and brand icons referenced by the page
- `robots.txt`, `site.webmanifest` — crawler and PWA metadata
- `_headers` — security and cache headers applied by Workers static assets
- `.assetsignore` — keeps tooling and source-control files out of the upload

## Behavior and accessibility

- The page renders without JavaScript; reveal animations default to visible and
  are only enabled once the script confirms support.
- The mobile menu traps focus, closes on Escape, returns focus to the toggle,
  and marks the page content inert while open.
- The pricing selector is a native radio fieldset, announces changes through a
  live region, and updates the checkout link for the selected plan.
- The results carousel supports buttons, dots, keyboard arrows, and a live
  position readout. Dot counts adapt to the number of visible cards.
- `prefers-reduced-motion` disables animation, smooth scrolling, and carousel
  easing.
- Focus-visible outlines, skip navigation, semantic headings, and labelled
  regions are included throughout.

## Analytics

Analytics is intentionally disabled until a data layer is configured. Set
`window.VCA_CONFIG.analytics.enabled` to `true` in `config.js` to push events to
the data layer. Every tracked interaction also dispatches a `vca:conversion`
`CustomEvent`, so another tag manager can listen without editing the page.

Events cover navigation, hero and pricing CTAs, plan selection, FAQ opens,
program, curriculum, results, process, fit, pricing, and final CTA views, social
links, and the sticky mobile CTA.

## Local preview

Any static file server works:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

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

## Before a public launch

- Set a canonical URL and make `og:image`, `og:url`, and `twitter:image`
  absolute for the production domain.
- Confirm the enrollment and contact URLs in `config.js` and the inline links.
- Confirm current pricing, guarantee terms, and call cadence with One Peak
  Creative.
- Review the photography and brand assets with the brand. They were sourced
  from One Peak Creative's public site; confirm usage rights before launch.
