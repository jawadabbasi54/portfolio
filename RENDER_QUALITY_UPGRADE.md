# Rendering Quality Upgrade

This record describes the globe rendering-quality work. Later performance work added adaptive delivery tiers without changing the intended high-end appearance.

## Improvements

- Separate 4K surface and emissive city-light maps
- Derived normal, specular, and roughness maps
- Maximum supported anisotropic filtering and trilinear mip sampling
- Selective bloom layer for routes, orbit rings, particles, and markers
- Earth excluded from bloom to preserve city-light detail
- Higher local contrast and cooler cinematic color grade
- Thin, crisp Fresnel atmosphere and reduced glass haze
- Tighter orbit and marker glow
- Adaptive pixel ratio retained for performance
- 2K and 1K WebP texture tiers selected from device capability and Save-Data preference
- Deferred texture loading behind the lightweight page bootstrap
- Smooth city-light highlight roll-off that prevents dense texture samples from clipping into white hotspots

## Changed files

- `public/script.js`
- `src/layouts/BaseLayout.astro` (browser asset cache version only)
- `public/assets/textures/earth_surface_4096.png`
- `public/assets/textures/earth_lights_4096.png`
- `public/assets/textures/earth_normal_2048.png`
- `public/assets/textures/earth_specular_2048.png`
- `public/assets/textures/earth_roughness_2048.png`
