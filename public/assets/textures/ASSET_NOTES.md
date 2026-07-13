# Earth night texture

`earth_night_2048.png` is a locally generated derivative used only by the globe. It combines a darkened Blue Marble-style base from the installed Basemap data package with Natural Earth country geometry and procedurally generated city-light clusters. The application makes no runtime network request for this texture.

All production Earth textures are stored in this directory and loaded locally by `public/script.js`. They are deployment assets rather than Astro source imports, so their public URLs begin with `/assets/textures/`.

## Adaptive delivery tiers

- High-capability desktops use the original 4K surface and lighting maps with 2K material maps.
- Typical devices use `earth_surface_2048.webp`, `earth_lights_points_2048.webp`, and 1K WebP material maps.
- Constrained, narrow, or Save-Data devices use the 1K WebP surface and lighting maps.

The WebP derivatives preserve the original sources while substantially reducing transfer size. Texture selection happens before loading, so visitors do not download tiers their devices will not use.

The legacy `aws_region_embedded_*` derivatives remain archived in this directory but are no longer requested. Their procedural starburst pixels produced blocky white artifacts on some desktop and mobile GPUs. AWS regions are represented by the projected pins, labels, ripples, and deployment animation instead.
