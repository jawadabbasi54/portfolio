# Developer alignment adjustment

Only the Developer group alignment was changed:

- The Developer caption is centered directly below the coding icon.
- The CLI terminal is positioned immediately to the right with a consistent gap.
- Responsive offsets were added for desktop, tablet, and mobile.
- No globe logic, GSAP sequence, regional deployment behavior, paths, controls, content, or other styling was changed.

## Current implementation files

- `src/pages/index.astro` contains the Developer node and terminal markup.
- `src/styles/global.css` contains its desktop, tablet, and mobile alignment rules.
