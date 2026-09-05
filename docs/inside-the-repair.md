# Inside the Repair

A photographic hardware tour at `/inside-the-repair`. Visitors select a component
on a MacBook or PS5 photo, read a short explanation, zoom in, and copy a link to
that component. Entry points live on the homepage, About page, and Quick Find.

This is descriptive editorial content. It does not diagnose devices, recommend
repairs, generate estimates, or collect intake details. Samuel owns diagnosis and
intake; keep future additions within that boundary.

## Editing

- `assets/repair-explorer-data.js`: descriptions, scene images, component locations,
  and service links. Coordinates are percentages of the original uncropped photo.
- `assets/repair-explorer.js`: selection, zoom, keyboard controls, and link copying.
- `assets/css/repair-explorer.css`: scoped tour and invitation styles.
- `scripts/build-repair-explorer.mjs`: generates `inside-the-repair.html`, reusing the
  header and footer from `contact.html`. Run it after changing descriptions or
  coordinates. The committed HTML lets search engines and visitors without
  JavaScript read every component explanation.

From the repository root (Node 22+):

```sh
node scripts/build-repair-explorer.mjs
node --test scripts/test-repair-explorer.mjs
node scripts/audit-indexability.mjs
```

Deployment remains static, without a required build step or new dependencies.
`main.js` and deployed `main.min.js` both include the Quick Find entry. The tour
stylesheet is separate, so the existing CSS minification does not need to run.

## Behavior and verification

- Numbered pins and component buttons select the same content. Left/right arrows,
  Home, and End work while a component control has keyboard focus.
- Zoom stays anchored to the selected component. The photo retains its original
  aspect ratio so pins stay aligned at different screen sizes.
- Copy-link URLs select a component without jumping past the photo. Query strings
  are excluded. A selectable text field appears if clipboard access is unavailable.
- No custom focus rings. Reduced-motion preferences disable animation.
- Without JavaScript, both photos and all eight explanations are visible.
- Print styles expose all component notes.

The automated tests cover route selection, camera boundaries, generated content,
local assets, and discovery links. Browser QA covered all eight components, zoom,
keyboard traversal, copy-link success, direct links, mobile interaction, and
responsive overflow. No requests are submitted and no visitor information is stored
by the tour itself. The site's existing shared scripts still run.
