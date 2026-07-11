# Jawad Abbasi — Premium DevOps Portfolio

A production-ready static portfolio with a bundled Three.js DevOps command-center globe. No runtime CDN, npm install, or Vercel build step is required.

## Local preview

```bash
python3 -m http.server 8082
```

Open `http://localhost:8082`.

## Vercel

- Framework Preset: **Other**
- Root Directory: `./`
- Build Command override: **Off**
- Install Command override: **Off**
- Output Directory override: **Off**

The interactive scene has a hard timeout and always falls back to the premium prototype artwork if WebGL cannot initialize. It cannot remain stuck on the loading screen.

## Main files

- `index.html`
- `styles.css`
- `script.js` — locally bundled Three.js application
- `assets/textures/` — local Earth textures
- `assets/prototype-fallback.png` — instant visual fallback
- `vercel.json`
