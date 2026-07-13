# Jawad Abbasi Portfolio — Astro + GSAP DevSecOps Globe

This is a statically generated Astro portfolio. It preserves the existing Three.js crystal globe, drag rotation, zoom, page layout, portfolio sections, crisp icon-based nodes, and synchronized GSAP animation layer.

Astro generates crawlable HTML at build time and bundles the global CSS. The interactive globe remains browser-side vanilla JavaScript so its existing behavior and rendering pipeline are unchanged.

## Globe changes

- Developer is represented by a code icon and a compact animated terminal.
- Git is represented by Bitbucket, GitHub, and GitLab brand icons.
- CI/CD stages use Snyk, Jenkins, Playwright, and AWS icons.
- AWS Multi-AZ text cards were removed.
- AWS regions use geographic glowing pins; US-EAST-1, EU-WEST-1, and AP-SOUTH-1 keep compact labels while other details appear on hover or click.
- CloudWatch is represented by a metrics icon.
- Alerts use Slack, phone, and email icons.
- DOM/SVG icons are projected onto Three.js anchor points, so they follow globe rotation while remaining sharp.

## GSAP sequence

1. Developer node and code terminal enter with `expo.out` easing.
2. The terminal types a release workflow.
3. An application-version package travels from Developer → Git → Security → Build → Test → Deploy → AWS.
4. Pipeline icons illuminate with a `stagger: 0.15` sequence.
5. On AWS receipt, a deployment wave runs AWS → US-EAST-1 → EU-WEST-1 → AP-SOUTH-1 while regional Multi-AZ lights pulse.
6. A telemetry pulse travels AWS → CloudWatch → Alerts.
7. ScrollTrigger pauses the repeating sequence while the globe is outside the viewport.

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`.

To validate and preview a production build:

```bash
npm run check
npm run build
npm run preview
```

## Vercel

Use these project settings:

- Framework Preset: **Astro**
- Root Directory: `./`
- Install Command: `npm install` (or leave as the detected default)
- Build Command: `npm run build` (or leave as the detected default)
- Output Directory: `dist` (or leave as the detected default)

The project uses Astro's static output and does not need the `@astrojs/vercel` server adapter. It contains local copies of Three.js, GSAP, and ScrollTrigger, so the hero does not depend on runtime CDN scripts.

## SEO

- Canonical, Open Graph, Twitter Card, and crawler metadata live in `src/layouts/BaseLayout.astro`.
- Person structured data is emitted as JSON-LD.
- `@astrojs/sitemap` generates the production sitemap.
- `public/robots.txt` points crawlers to the sitemap.

## Main integration points

- `src/pages/index.astro`: portfolio content plus `.globe-ui-layer` icon nodes and SVG flow paths.
- `src/layouts/BaseLayout.astro`: document shell, metadata, structured data, and browser script ordering.
- `src/styles/global.css`: complete visual system; search for `GSAP DevSecOps overlay`.
- `public/script.js`: search for `initGsapFlow`, `updateOverlayPaths`, and `deploymentIntensity`.
- `public/spider-web.js`: ambient particle-network background.
