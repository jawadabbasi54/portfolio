# GSAP overlay visibility fix

This patch does not replace or redesign the Three.js globe. It fixes the DOM icon projection and GSAP startup layer only.

## Root cause

The overlay used the projected clip-space `z` value to decide icon opacity. In a perspective camera that value is close to `1` for almost everything on screen, so every component was continuously forced to approximately 8% opacity. The GSAP sequence was running behind nearly transparent parent nodes.

## Fixes

- Uses globe-surface facing to fade front/back components correctly.
- Keeps front-facing Developer, Git, CI/CD, AWS, CloudWatch, and Alerts icons fully visible.
- Runs the GSAP timeline even if ScrollTrigger is unavailable.
- Uses ScrollTrigger only for viewport pause/resume.
- Adds an immediate visible-hero startup fallback.
- Makes the AWS SVG wordmark white while retaining its orange accent.
- Adds cache-busted asset versions for Vercel/browser refreshes.
