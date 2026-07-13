# Regional deployment refinement

Only the requested globe refinements were applied.

- Moved the Developer icon slightly above the typing terminal.
- Replaced the single AWS arrow and always-on regional fan with a sequential deployment wave:
  `AWS → US-EAST-1 → EU-WEST-1 → AP-SOUTH-1`.
- Clicking the AWS hub replays the deployment wave and isolates the Deployment layer.
- Kept only three compact region labels visible initially.
- Rendered all other regions as geographic glowing pins.
- Added hover, keyboard-focus, and click region cards with readable AZ-A/AZ-B/AZ-C details.
- Added lightweight EU and Asia-Pacific cluster counts to avoid overlapping labels.
- Updated region coordinates to their real-world city locations.
- Reduced background pin intensity behind labels.

The existing globe materials, page layout, portfolio sections, navigation, rotation, zoom, feedback loop, and layer controls were not redesigned.

## Current implementation files

- `public/script.js` contains region coordinates, projection, cards, and sequential deployment behavior.
- `src/pages/index.astro` contains deployment paths, region overlay containers, and layer controls.
- `src/styles/global.css` contains labels, cards, pins, pulses, and responsive positioning.
