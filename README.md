# Jawad Abbasi Portfolio — Astro + GSAP DevSecOps Globe

Jawad Abbasi's statically generated portfolio, built with Astro for crawlable HTML, strong SEO, and fast delivery. The original Three.js crystal globe, GSAP lifecycle animation, drag rotation, zoom, responsive layout, and portfolio content remain browser-side vanilla JavaScript.

Production: [jawadabbasi.com](https://jawadabbasi.com)

## Technology

- Astro 7 with static output
- TypeScript configuration through Astro
- Three.js for the WebGL globe
- GSAP and ScrollTrigger for motion
- Vanilla JavaScript for page and globe behavior
- Vercel for static hosting
- Cloudflare for DNS and edge delivery

Three.js, GSAP, and ScrollTrigger are stored locally under `public/vendor`, so the page does not depend on a runtime JavaScript CDN.

## Local development

Install dependencies and start Astro's development server:

```bash
npm install
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`.

Validate and preview the production build:

```bash
npm run check
npm run build
npm run preview
```

`npm run preview` serves the already-generated `dist` directory. Run `npm run build` again after source changes.

## Vercel deployment

Connect the GitHub repository and use:

- Framework Preset: **Astro**
- Root Directory: `./`
- Install Command: `npm install`, or the detected default
- Build Command: `npm run build`, or the detected default
- Output Directory: `dist`, or the detected default

The site uses Astro's static output and does not require the `@astrojs/vercel` server adapter. `vercel.json` declares the Astro framework, clean URLs, security headers, and long-lived caching for cache-versioned local scripts.

## SEO and indexing

- Canonical, description, crawler, Open Graph, and Twitter Card metadata are defined in `src/layouts/BaseLayout.astro`.
- JSON-LD describes the page with linked `ProfilePage`, `WebSite`, and `Person` entities.
- The social sharing image is `public/assets/og-cover.png` at 1200×630.
- `@astrojs/sitemap` generates `sitemap-index.xml` and its child sitemap during `npm run build`.
- `public/robots.txt` allows crawling and references the production sitemap.
- Google Search Console uses a verified Domain property for `jawadabbasi.com`.

After a production deployment, submit this sitemap in Google Search Console:

```text
https://jawadabbasi.com/sitemap-index.xml
```

Domain verification is maintained through the DNS TXT record and does not require a verification file in this repository. Keep that TXT record in DNS.

## Loading strategy

- Astro emits the page content as static HTML and bundles the global stylesheet.
- Large globe textures are requested by the deferred globe runtime rather than being force-preloaded ahead of critical HTML and CSS.
- Public image assets are served with long-lived caching by the deployment platform.
- Versioned local runtime and vendor scripts receive immutable cache headers from `vercel.json`.
- WebGL quality, device-pixel ratio, bloom, and particle counts adapt to the device.
- Globe and background rendering pause when hidden or outside the viewport, and reduced-motion preferences are respected.

## Project structure

```text
src/
  layouts/BaseLayout.astro   Document shell, SEO metadata, JSON-LD, scripts
  pages/index.astro          Portfolio content and globe overlay markup
  styles/global.css          Complete visual and responsive styling
public/
  assets/                    Favicons, social image, icons, and globe textures
  vendor/                    Local Three.js, GSAP, and ScrollTrigger builds
  robots.txt                 Crawler policy and sitemap location
  script.js                  Navigation, motion, globe, and lifecycle runtime
  spider-web.js              Ambient constellation background
astro.config.mjs             Static site URL and sitemap integration
vercel.json                  Vercel framework, URL, header, and cache settings
```

Astro generates `dist/`; do not edit generated files directly.

## Globe behavior

- Developer uses a code icon and animated terminal.
- Repository uses Bitbucket, GitHub, and GitLab icons.
- CI/CD uses Snyk, Jenkins, Playwright, and AWS stages.
- Geographic AWS pins and region overlays follow globe rotation.
- CloudWatch and alert nodes complete the feedback loop.
- DOM/SVG controls are projected onto Three.js anchors to stay crisp.
- The lifecycle runs Developer → Repository → CI/CD → AWS regions → CloudWatch → Alerts → Developer.

## Documentation

The other Markdown files in the repository are focused implementation records for the globe, rendering, regional deployment, page sections, and performance work. Their file references use the current Astro structure even when they describe changes that originally predated the Astro migration. `CHANGELOG.md` provides the project-level summary.
