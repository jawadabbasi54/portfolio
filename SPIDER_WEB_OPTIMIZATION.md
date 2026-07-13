# Spider-Web Performance Optimization

This record covers performance work in the ambient `public/spider-web.js` layer.

## Changes

- Reduced ambient drawing from roughly 36 FPS to 24 FPS while the pointer is active and 18 FPS while idle.
- Pauses spider-web redraws while the globe is being dragged; the last background frame stays visible.
- Caps the ambient canvas pixel ratio at 1.25 on desktop and 1.0 on mobile/coarse-pointer devices.
- Uses fewer responsive particles while preserving the same blue/orange constellation appearance.
- Replaced per-particle `shadowBlur` with cached radial-glow sprites.
- Replaced all-to-all particle comparisons with a spatial grid.
- Debounced canvas resize work.
- Continues to pause when the browser tab is hidden and respects reduced-motion preferences.
- Uses a static, responsive constellation on coarse-pointer, narrow, low-memory, or Save-Data devices, avoiding a continuous background animation where it offers little interaction value.
- Reduces its active frame rate while the globe is visible so the decorative canvas does not compete with WebGL rendering.

## Unchanged

- Constellation palette, twinkle, pointer attraction, and connecting-line visual style
