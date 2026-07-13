# Spider-web background addition

Only a standalone ambient background layer was added.

## Files changed

- `src/pages/index.astro`: contains the fixed background canvas.
- `src/layouts/BaseLayout.astro`: loads the ambient background runtime.
- `src/styles/global.css`: contains canvas stacking and opacity rules.
- `public/spider-web.js`: self-contained constellation animation.

The existing globe, Three.js scene, GSAP timelines, cards, navigation, page copy and contact details were not modified.
