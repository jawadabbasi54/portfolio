# Jawad Abbasi Portfolio — Astro DevSecOps Portfolio

Jawad Abbasi's statically generated portfolio, built with Astro for crawlable HTML, strong SEO, and fast delivery. It combines an interactive Three.js DevSecOps globe with résumé-backed experience, a downloadable résumé, and dedicated technical case studies.

Production: [jawadabbasi.com](https://jawadabbasi.com)

## Technology

- Astro 7 with static output
- TypeScript configuration through Astro
- Three.js for the WebGL globe
- GSAP and ScrollTrigger for motion
- Vanilla JavaScript for page and globe behavior
- Playwright for responsive browser tests
- Vercel for static hosting
- Cloudflare for DNS and edge delivery

Three.js, GSAP, and ScrollTrigger are stored locally under `public/vendor`, so the site has no runtime JavaScript CDN dependency.

## Local development

Install dependencies and start Astro's development server:

```bash
npm install
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`.

Validate and preview a production build:

```bash
npm run check
npm run build
npm run preview
```

`npm run preview` serves the generated `dist` directory. Run `npm run build` again after source changes.

Run the complete local validation suite:

```bash
npm run quality
npx playwright install chromium # first browser-test run only
npm run test:e2e
```

`npm run quality` type-checks Astro, builds every route, and verifies the generated metadata, sitemap, robots policy, résumé file, case studies, and custom 404 page.

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
- JSON-LD describes the home page with linked `ProfilePage`, `WebSite`, and `Person` entities. Each case study emits its own `TechArticle` data.
- The social sharing image is `public/assets/og-cover.png` at 1200×630.
- `@astrojs/sitemap` generates `sitemap-index.xml` and its child sitemap during `npm run build` while excluding the 404 route.
- `public/robots.txt` allows crawling and references the production sitemap.
- Google Search Console uses a verified Domain property for `jawadabbasi.com`.

Submit this sitemap in Google Search Console after deployment:

```text
https://jawadabbasi.com/sitemap-index.xml
```

Domain verification is maintained through the DNS TXT record and does not require a verification file in this repository. Keep that TXT record in DNS.

## Loading strategy

- Astro emits crawlable page content as static HTML and bundles the global stylesheet.
- The initial page loads a small bootstrap. GSAP, Three.js, and globe textures load during desktop idle time, or on mobile when the visitor approaches or interacts with the globe.
- The globe selects high, medium, or low texture tiers from device memory, CPU capacity, viewport, and Save-Data preferences.
- Public image assets are served with long-lived caching by the deployment platform.
- Versioned local runtime and vendor scripts receive immutable cache headers from `vercel.json`.
- WebGL quality, pixel ratio, bloom, and particle counts adapt to the device.
- The ambient background uses an efficient static constellation on resource-constrained and coarse-pointer devices.
- Globe and background rendering pause when hidden or outside the viewport; reduced-motion and data-saving preferences are respected.

## Project structure

```text
src/
  components/                Shared header, footer, and case-study cards
  layouts/BaseLayout.astro   Document shell, SEO metadata, JSON-LD, bootstrap
  layouts/CaseStudyLayout.astro
  pages/index.astro          Portfolio, résumé, and globe overlay markup
  pages/404.astro            Branded no-index not-found page
  pages/case-studies/        Four detailed technical case studies
  styles/global.css          Complete visual and responsive styling
public/
  assets/                    Favicons, social image, icons, and globe textures
  vendor/                    Local Three.js, GSAP, and ScrollTrigger builds
  Jawad_Abbasi_Resume.pdf    Downloadable résumé
  page-loader.js             Navigation and lazy-runtime bootstrap
  robots.txt                 Crawler policy and sitemap location
  script.js                  Motion, globe, and lifecycle runtime
  spider-web.js              Ambient constellation background
scripts/                     Build-output and Lighthouse budget verification
tests/                       Desktop and mobile Playwright coverage
.github/workflows/quality.yml
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

## Case studies and résumé

The case studies cover enterprise AWS IoT delivery, multi-environment Terraform infrastructure, secure CI/CD automation, and observability/incident response. Their claims are deliberately grounded in the supplied résumé; unsupported metrics, certifications, client names, and outcomes are not invented.

The résumé is published as `/Jawad_Abbasi_Resume.pdf` and linked with the browser `download` attribute from the home page and shared navigation.

## Quality gates

GitHub Actions runs type checks, a production build, generated-output verification, Playwright browser coverage, and a mobile Lighthouse budget on pushes to `main` and pull requests. Lighthouse minimums are maintained in `scripts/verify-lighthouse.mjs`.

## Documentation

The other Markdown files are focused implementation records for globe rendering, regional deployment, page sections, and performance work. Their file references use the current Astro structure even when they describe changes that predate the Astro migration. `CHANGELOG.md` provides the project-level summary.
