# Jawad Abbasi — Animated DevOps Portfolio

A static, production-ready one-page portfolio with a custom Three.js **Living DevOps Ecosystem** globe.

## Highlights

- Procedural 3D Earth with atmosphere, night lights, clouds, and engineered grid overlay
- Six technology orbits: Git, Docker, Terraform, AWS, Linux, and CI/CD
- Animated data particles and interactive hover descriptions
- Repeating deployment pulse: Git → CI/CD → Docker → Terraform → AWS → Earth
- Crystal/glass UI, scroll reveals, responsive layouts, reduced-motion support, and static fallback
- SEO metadata and Person schema
- No backend required

## Preview locally

From this folder, run either:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

You can also use:

```bash
npx serve .
```

> The Three.js modules are loaded from jsDelivr, so the browser needs an internet connection during preview and on the deployed website.

## Deploy

Upload the entire folder to any static host:

- AWS S3 + CloudFront
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

For `jawadabbasi.com`, point the domain to the chosen host and keep every file/folder path unchanged.

## Customize

- Main content: `index.html`
- Visual design: `styles.css`
- Navigation, scroll effects, counters, and UI: `page.js`
- Three.js globe and deployment animation: `script.js`
- Earth textures and favicon: `assets/`

Contact details currently configured:

- Email: `jawadabbasi54@gmail.com`
- Phone: `+92 332 5501123`
- LinkedIn: `jawad-abbasi-573772117`
