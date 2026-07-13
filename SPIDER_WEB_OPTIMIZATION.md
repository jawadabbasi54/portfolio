# Spider-Web Performance Optimization

Only the ambient `public/spider-web.js` layer was optimized. The Three.js globe, GSAP timelines, page layout, sections, and existing styling were not modified.

## Changes

- Reduced ambient drawing from roughly 36 FPS to 24 FPS while the pointer is active and 18 FPS while idle.
- Pauses spider-web redraws while the globe is being dragged; the last background frame stays visible.
- Caps the ambient canvas pixel ratio at 1.25 on desktop and 1.0 on mobile/coarse-pointer devices.
- Uses fewer responsive particles while preserving the same blue/orange constellation appearance.
- Replaced per-particle `shadowBlur` with cached radial-glow sprites.
- Replaced all-to-all particle comparisons with a spatial grid.
- Debounced canvas resize work.
- Continues to pause when the browser tab is hidden and respects reduced-motion preferences.

## Unchanged

- Globe files and globe behavior
- GSAP timeline logic
- HTML layout and portfolio content
- CSS presentation
- Constellation palette, twinkle, pointer attraction, and connecting-line visual style
