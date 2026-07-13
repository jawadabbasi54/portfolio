# Globe visual upgrade

## Preserved

- Existing HTML/component structure
- Globe drag, inertial rotation, wheel zoom, and auto-rotate control
- GSAP DevOps lifecycle and feedback loop
- Region hover/click cards and AWS deployment sequence
- Code flow, Deployment, and Monitoring isolation controls
- All surrounding portfolio content and styling

## Added

- Realistic local Earth night texture
- Fresnel atmosphere and outer glow shaders
- Animated blue network arcs
- Animated orange deployment arcs
- Cyan monitoring arcs
- Curve-following flow particles
- Emissive node cores and marker pulses
- Parallax shader star layers
- Lightweight adaptive bloom
- Frame-rate-independent motion and adaptive render quality

## Performance strategy

- High, medium, and low quality profiles are selected from viewport size and CPU concurrency.
- Device pixel ratio is capped per profile.
- Bloom is disabled on low-tier/mobile profiles and runs below full resolution otherwise.
- The WebGL scene renders at display rate; DOM icon projection updates every second frame.
- Rendering pauses when the globe is outside the viewport or the browser tab is hidden.
- No new JavaScript dependency was added.

## Current implementation files

- `public/script.js` contains the Three.js scene, shaders, routes, particles, bloom, and adaptive rendering.
- `public/assets/textures` contains all local Earth material maps.
- `src/pages/index.astro` contains the projected overlay markup and controls.
- `src/styles/global.css` contains the globe stage and responsive presentation.
