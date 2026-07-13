# Changelog

## 2026-07-13 — Production SEO and delivery hardening

- Expanded JSON-LD from a standalone Person into linked ProfilePage, WebSite, and Person entities.
- Added explicit Open Graph image type, dimensions, and secure URL metadata.
- Removed eager preloads that competed with critical HTML and CSS for bandwidth.
- Added Vercel security headers and immutable caching for versioned local scripts.
- Verified the Astro check, static build, generated sitemap, robots policy, and production-preview responses.
- Documented the verified Google Search Console Domain property and sitemap workflow.

## 2026-07-11 — Astro migration

- Converted the static portfolio shell to Astro while preserving the existing page design and interactive globe.
- Moved page markup to `src/pages/index.astro` and global styling to `src/styles/global.css`.
- Added `src/layouts/BaseLayout.astro` for metadata, structured data, and ordered browser scripts.
- Added static sitemap generation with `@astrojs/sitemap` and configured Vercel's Astro preset.
- Kept Three.js, GSAP, ScrollTrigger, globe textures, and runtime scripts as local public assets.

## Interactive globe and animation work

- Replaced text/card sprites with locally stored brand icons and crisp projected DOM nodes.
- Added animated terminal typing and the GSAP DevSecOps lifecycle sequence.
- Added pipeline staging, application-package travel, deployment waves, telemetry, and alert feedback.
- Added ScrollTrigger-based viewport lifecycle control.
- Added realistic Earth materials, AWS regional markers, selective bloom, adaptive quality, and the optimized spider-web background.
- Preserved the portfolio sections and the globe's rotation, zoom, layer controls, and interactions throughout the upgrades.

Detailed implementation records remain in the topic-specific Markdown files at the repository root.
