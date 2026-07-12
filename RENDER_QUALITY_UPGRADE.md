# Rendering Quality Upgrade

This update changes only globe rendering quality and texture assets. The layout, camera, UI, interactions, animations, component hierarchy, controls, and section structure are unchanged.

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

## Changed files

- `script.js`
- `index.html` (cache version only)
- `assets/textures/earth_surface_4096.png`
- `assets/textures/earth_lights_4096.png`
- `assets/textures/earth_normal_2048.png`
- `assets/textures/earth_specular_2048.png`
- `assets/textures/earth_roughness_2048.png`
