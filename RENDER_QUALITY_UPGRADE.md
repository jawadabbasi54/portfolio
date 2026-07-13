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
- Removed the redundant embedded AWS-region starburst texture; projected region pins and deployment effects remain the single region-visualization layer
- Natural Earth coastline masking keeps every emissive city-light sample on land
- Foreground star exclusion keeps decorative space particles outside the visible Earth silhouette
- Firm high-detail coastline sampling prevents faded emissive leakage beyond land boundaries
- A desktop-only warm illumination bed gives populated regions a visibly richer night-side finish
- Full baked-halo removal prevents the base surface from leaking faded rings beneath the land-masked emissive layer
- Capability-aware desktop light gain adds a warmer, more visible night-light finish without increasing mobile rendering cost

## Changed files

- `public/script.js`
- `src/layouts/BaseLayout.astro` (browser asset cache version only)
- `public/assets/textures/earth_surface_4096.png`
- `public/assets/textures/earth_lights_4096.png`
- `public/assets/textures/earth_normal_2048.png`
- `public/assets/textures/earth_specular_2048.png`
- `public/assets/textures/earth_roughness_2048.png`
- `public/assets/textures/earth_land_mask_2048.webp`
