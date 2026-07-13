# Earth night texture

`earth_night_2048.png` is a locally generated derivative used only by the globe. It combines a darkened Blue Marble-style base from the installed Basemap data package with Natural Earth country geometry and procedurally generated city-light clusters. The application makes no runtime network request for this texture.

All production Earth textures are stored in this directory and loaded locally by `public/script.js`. They are deployment assets rather than Astro source imports, so their public URLs begin with `/assets/textures/`.
