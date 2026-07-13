Updated only the AWS region surface implementation:

- Region markers are now attached directly to the globe surface at the correct geographic coordinates.
- Added embedded region light clusters through a dedicated globe texture so the illumination blends into the Earth night map.
- Kept the existing floating region labels, connection lines, deployment waves, layout, UI, animations, camera, lighting, and interactions unchanged.
- Removed the prototype fallback image so the interactive globe loads immediately.

## Current implementation files

- `public/script.js` contains the marker projection, surface effects, and region behavior.
- `public/assets/textures/aws_region_embedded_4096.png` contains the embedded regional glow texture.
- `src/pages/index.astro` contains the accessible region overlay layer used above the globe.
