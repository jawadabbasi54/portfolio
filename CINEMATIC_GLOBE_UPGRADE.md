# Cinematic Globe Motion Upgrade

This build upgrades the existing globe in place. The HTML layout, projected DOM components, GSAP lifecycle, drag/zoom controls, region interactions, layer controls, portfolio sections, and spider-web background remain structurally unchanged.

## Rendering upgrades

- Enhanced night-side Earth shader with independently twinkling city lights.
- Procedural, slowly rotating cloud shell using a three-octave GPU noise shader.
- Multi-lobe atmospheric Fresnel scattering with Rayleigh-style horizon color and subtle Mie forward scattering.
- Continuous shader-based energy streams in place of segmented/dashed globe arcs.
- Existing route particles retained and synchronized with the new energy stream materials.
- GPU-batched AWS region ripple markers and vertical deployment beams.
- Three orbit rings now use different thicknesses, speeds, moving highlights, pulse rates, and low-amplitude wobble.
- Added a low-opacity foreground space-dust layer to the existing parallax starfield.
- Stronger selective bloom with a higher threshold so emissive routes and markers glow without washing out the Earth.
- Gentle camera drift that yields immediately to drag input and keeps projected HTML nodes aligned.
- Animated glass reflections added to existing globe UI surfaces without changing dimensions or positioning.

## Performance safeguards

- No additional runtime dependencies.
- Existing local Three.js bundle retained.
- Low and medium quality profiles remain active on constrained devices.
- Bloom remains disabled on the low profile.
- Region ripple effects use one Points draw call; beams use one LineSegments draw call.
- DOM projection remains capped at 30 FPS while WebGL renders at display rate.
- Rendering pauses when the globe is outside the viewport or the tab is hidden.
- Conservative adaptive device-pixel-ratio scaling responds to sustained frame time rather than changing every frame.
- Reduced-motion behavior remains supported.

## Files changed

- `public/script.js`: globe shaders, motion, route materials, marker effects, camera drift, and adaptive rendering.
- `src/styles/global.css`: existing globe UI reflection polish and solid flow-line presentation.
- `src/layouts/BaseLayout.astro`: browser asset cache-version references.
