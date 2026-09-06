# Back together — homepage repair animation

A lazy-loaded Three.js aside at `/#repair-play`. This is an authored iPhone 16 Pro Max study: the exterior uses the published 77.6 × 163 × 8.25 mm envelope at 0.03 scene units per millimetre. Interior shapes and the exploded choreography are visual interpretations, not manufacturing CAD or a repair sequence.

## Reference

- [Apple technical specifications and exterior photographs](https://support.apple.com/en-au/121032)
- [Apple internal and exploded views](https://support.apple.com/en-ie/120821)
- [Apple repair manual](https://support.apple.com/en-ie/120819)

The geometry has one hollow titanium enclosure, thin seated display and rear glass, a triangular three-camera array, flash/LiDAR, Dynamic Island, separate Action/volume/side/Camera Control buttons, USB-C and two bottom screws. The battery is one shaped pack. A glass gasket replaces the earlier second metal frame. Bevels are included within nominal dimensions so they cannot accidentally thicken the closed phone.

The second detail pass adds independently moving camera cans, removable board shields, a TrueDepth sensor bridge, a Taptic Engine, a speaker chamber with grille, an internal USB-C socket and microphone flex. The board includes plated vias, fine traces, passive components, solder terminations and shared-atlas markings. Helical threads are modeled on the two bottom screws.

The display fans away slightly while open. Camera and speaker assemblies seat first; the board shields follow. Battery and display ribbons bend along cubic curves into their sockets, then the display closes and the two screws tighten sequentially. Every deformation and transform is derived from assembly progress, so dragging backward reverses the same motion without accumulated drift. These are visual choreography choices, not instructions for servicing a real phone.

The inspection pass adds an optional native dialog, opened from the phone or “Explore the details.” Visitors can select components directly on the model or with named buttons, orbit by dragging (or arrow keys), pan with Shift-drag/Shift-arrow keys or a two-finger gesture, zoom with the wheel/pinch/buttons, and scrub assembly. Selecting a part isolates it and gently reframes the camera. Closing restores the aside’s previous assembly position, playback state, and keyboard focus. The same renderer and canvas are moved into the dialog; no second WebGL context or model is allocated.

Finishes use small seeded, mipmapped procedural textures for brushed titanium, matte glass and battery foil. One filtered directional shadow map gives the internal layers contact and depth. The 20-second cycle includes pauses after shields and connectors seat; the screen wakes after final fastening. The renderer samples active frame intervals and gradually lowers pixel density, then disables shadows if performance remains poor at the minimum density. It ignores background stalls and pauses, and keeps a cooldown between adjustments. This is an adaptive safeguard; physical-handset performance has not been benchmarked here.

## Files

- `assets/repair-ballet.js`: viewport-proximity loader and fallback.
- `assets/repair-phone-model.mjs`: geometry, physical materials, and mechanical assemblies.
- `assets/repair-phone-rig.mjs`: reversible component motion, deforming flex ribbons, and sequential screw tightening.
- `assets/repair-ballet-motion.mjs`: deterministic assembly positions and cycle.
- `assets/repair-ballet-scene.js`: lighting, procedural lock screen, controls, visibility and lifecycle.
- `assets/repair-inspector.js`: accessible dialog, pointer/touch/keyboard input, component labels and focus restoration.
- `assets/repair-inspection-view.mjs`: component isolation, ray picking, orbit, zoom and framing.
- `assets/repair-phone-surfaces.mjs`: shared procedural finish maps.
- `assets/repair-render-quality.mjs`: frame-time sampling and conservative quality reductions.
- `assets/css/repair-ballet.css`: scoped responsive aside.
- `assets/vendor/three/`: locally hosted Three.js 0.185.1, RoomEnvironment and MIT license.

Play/pause, replay, front/back turn, and a keyboard-operable assembly slider work independently. Scrubbing pauses; play resumes at the chosen assembly state. Reduced-motion visitors start with the assembled phone, with manual controls available and immediate front/back switching. Rendering stops when paused, offscreen or in a hidden document. The visibility observer is supplemented by a passive scroll check, so a layout shift or anchor jump cannot strand an otherwise visible scene. A static illustration remains available without WebGL or JavaScript.

No remote models, textures, device APIs or diagnostic automation are used. GPU resources are disposed on page exit and paused for the back/forward cache.

## Validation

Run `node --test scripts/test-repair-phone.mjs` for actual geometry bounds, internal clearances, connector alignment, normalized ribbon surfaces, reversible poses, screw placement/timing, texture coordinates and animation continuity. Run `node --test scripts/test-repair-inspection.mjs` for isolated-part framing, orbit bounds, visibility restoration and quality adaptation. Run `node scripts/audit-indexability.mjs` for the existing site audit.

The unfinished photographic explorer remains under `archived/inside-the-repair/` and is excluded by `.vercelignore`. This animation does not restore its public route or navigation.
