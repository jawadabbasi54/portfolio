# Jawad Abbasi Portfolio — GSAP DevSecOps Globe

This package preserves the existing Three.js crystal globe, drag rotation, zoom, page layout, and portfolio sections. It replaces the old text-heavy globe cards with crisp icon-based nodes and adds a synchronized GSAP animation layer.

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

## Local preview

```bash
cd jawad-devops-portfolio-gsap
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Vercel

Use these project settings:

- Framework Preset: **Other**
- Root Directory: `./`
- Build Command: disabled
- Install Command: disabled
- Output Directory override: disabled

The package contains local copies of Three.js, GSAP, and ScrollTrigger, so the hero does not depend on runtime CDN scripts.

## Main integration points

- `index.html`: `.globe-ui-layer` contains the icon nodes and SVG flow paths.
- `styles.css`: search for `GSAP DevSecOps overlay`.
- `script.js`: search for `initGsapFlow`, `updateOverlayPaths`, and `deploymentIntensity`.
