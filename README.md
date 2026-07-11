# Jawad Abbasi Portfolio — Premium Crystal Globe

This build replaces the terrain-style Earth with a procedural, premium crystal globe.

## What changed

- No terrain/daylight map is used.
- The globe is rendered as a deep royal-blue glass sphere with a sharp Fresnel edge, luminous city-light network, holographic latitude/longitude grid, engineering wireframe, and three animated orbit rings.
- Developer, Git, CI/CD, AWS, CloudWatch, and Alerts cards rotate with the globe.
- AWS connects to eight region cards, each showing three Availability Zones.
- Animated packets represent code flow, deployment, monitoring, and alert delivery.
- Bloom/post-processing was removed to prevent washed-out or blurry rendering.
- Three.js is bundled locally under `vendor/`, so Vercel does not depend on a runtime CDN.
- The approved prototype remains only as a fallback and is fully removed once WebGL starts.

## Local preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Vercel settings

- Framework Preset: **Other**
- Root Directory: `./`
- Build Command: disabled
- Install Command: disabled
- Output Directory override: disabled

After pushing, test the newest `.vercel.app` deployment first, then confirm `jawadabbasi.com` is attached to that same production project.
