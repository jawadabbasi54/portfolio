# Changelog

## 2026-07-14 — Mobile globe CLI visibility

- Restored the compact animated CLI terminal beside the Developer node on mobile viewports.
- Added a mobile browser regression check that waits for the deferred globe runtime and verifies the terminal is visible.

## 2026-07-14 — Portfolio content, performance, and quality pass

- Added four résumé-backed case-study routes with shared Astro components, article metadata, structured data, outcomes, responsibilities, and architecture narratives.
- Added the downloadable PDF résumé, a focused résumé section, stronger calls to action, clearer role/location signals, and refined mobile/desktop presentation.
- Added an adaptive page bootstrap that defers Three.js and GSAP without hiding crawlable content or blocking normal navigation.
- Added device-aware WebP globe texture tiers and a low-cost static constellation mode for mobile, coarse-pointer, low-memory, and Save-Data visitors.
- Batched globe projection layout reads and kept all SVG routes anchored to projected surface points.
- Added a branded no-index 404 page, web app manifest, touch icons, article Open Graph data, and a sitemap filter for non-content routes.
- Added Playwright coverage, generated-build assertions, a Lighthouse performance budget, and a GitHub Actions quality workflow.
- Added security and cache headers, including a report-only Content Security Policy for safe production observation.

## 2026-07-14 — Rotation-safe globe flow anchoring

- Added a perspective-correct SVG clip derived from the camera-to-globe tangent boundary.
- Kept code, deployment, monitoring, and feedback routes inside the visible Earth silhouette at every rotation angle.
- Made the clip update with camera drift, zoom, and responsive stage resizing.
- Preserved the existing Three.js globe, node positions, GSAP lifecycle timing, controls, and visual design.

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
