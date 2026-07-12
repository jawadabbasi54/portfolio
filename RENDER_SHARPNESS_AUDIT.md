# Earth rendering sharpness audit

This update changes only Earth rendering quality and the globe canvas sampling. Layout, camera, scene composition, UI, animations, component hierarchy, and interactions are unchanged.

## Findings

1. **Texture dimensions were not the main failure.** Both the surface and emissive maps were already 4096×2048.
2. **The emissive source had low effective detail.** The existing 4K light map contained broad procedural clusters, so mip filtering correctly averaged those clusters into soft patches. A new 4K point-light map is derived from the source map's local maxima while preserving the same geographic distribution.
3. **The custom Earth shader sampled sRGB color maps without explicitly decoding them.** Arbitrary samplers in this ShaderMaterial were being treated as linear values, lifting midtones and widening the apparent light footprint. Surface and light textures are now explicitly decoded from sRGB in the shader.
4. **The surface map already contained baked city lights.** It was only partially suppressed before the separate emissive map was added, causing a double contribution. The original light map is now used only as a removal mask; the discrete point map is added once.
5. **The Earth shader applied a local Reinhard-style compression and the renderer then applied ACES tone mapping.** This double highlight compression flattened bright points. The local tone-map curve was removed; ACES remains the single highlight roll-off stage.
6. **Mipmaps and filtering were configured correctly, but their default LOD was too soft for tiny emissive points at the displayed globe size.** Trilinear mipmaps remain enabled for stability, with a small negative LOD bias for the surface and a stronger bias for point lights.
7. **Anisotropy was capped by the quality profile.** The globe now uses the maximum anisotropy supported by the GPU.
8. **Desktop DPR could be capped at 1.22 on four-core systems.** The existing adaptive scaler is retained, but the desktop cap and floor are raised enough to preserve 4K texture detail. Mobile caps are unchanged in spirit.
9. **Bloom was already selective.** Earth is on layer 0 only; bloom renders layer 1. Bloom was therefore not the source of the Earth-light softness and its composition was not redesigned.
10. **ACES tone mapping and sRGB screen output were already appropriate.** They are retained; only the duplicate local compression and texture decode path were corrected.

## Changed files

- `script.js`
- `index.html` (cache version only)
- `assets/textures/earth_lights_points_4096.png`
