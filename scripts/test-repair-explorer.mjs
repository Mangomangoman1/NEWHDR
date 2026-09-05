import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scenes, cameraFor, selectionFromHash } from '../assets/repair-explorer-data.js';
const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(`${root}/inside-the-repair.html`, 'utf8');

test('every shareable component resolves to its own scene', () => {
  const ids = new Set();
  for (const scene of scenes) for (const part of scene.parts) {
    const hash = `#${scene.id}-${part.id}`;
    assert.ok(!ids.has(hash)); ids.add(hash);
    assert.deepEqual(selectionFromHash(hash), { scene, part });
  }
  for (const hash of ['', '#unknown', '#ps5-unknown', '#<script>']) {
    assert.equal(selectionFromHash(hash).scene.id, 'macbook');
    assert.equal(selectionFromHash(hash).part.id, 'battery');
  }
});

test('close-up framing keeps selected parts visible without blank photo edges', () => {
  // Cover every point, not only current editorial markers: future markers
  // near an edge must also stay inside the viewport.
  for (const zoom of [1, 2]) for (let x = 0; x <= 100; x++) for (let y = 0; y <= 100; y++) {
    const camera = cameraFor({ x, y }, zoom);
    assert.ok(camera.x <= 0 && camera.y <= 0);
    assert.ok(camera.x + 100 * zoom >= 100 && camera.y + 100 * zoom >= 100);
    assert.ok(x * zoom + camera.x >= 0 && x * zoom + camera.x <= 100);
    assert.ok(y * zoom + camera.y >= 0 && y * zoom + camera.y <= 100);
    if (zoom === 1) assert.deepEqual(camera, { x: 0, y: 0, zoom: 1 });
  }
});

test('all content and resources ship in the static page without JavaScript', () => {
  for (const scene of scenes) {
    assert.ok(existsSync(root + scene.image));
    assert.ok(existsSync(root + scene.link + '.html'));
    for (const part of scene.parts) {
      assert.ok(part.x > 5 && part.x < 95 && part.y > 5 && part.y < 95);
      assert.ok(html.includes(`<h2>${part.title}</h2>`), `${part.id} headline out of sync; rebuild page`);
      assert.ok(html.includes(`<p>${part.body}</p>`), `${part.id} content out of sync; rebuild page`);
      assert.ok(html.includes(`<p>${part.detail}</p>`));
      assert.ok(html.includes(`id="part-${scene.id}-${part.id}"`));
    }
  }
  assert.ok(!/<(?:section|article)[^>]* hidden/.test(html));
  for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"#]*)?"/g)) {
    if (path === '/') continue;
    assert.ok(existsSync(root + path) || existsSync(root + path + '.html'), `missing ${path}`);
  }
});

test('discovery links are present in deployed and source assets', () => {
  for (const name of ['main.js', 'main.min.js', 'index.html', 'about.html', 'sitemap.xml']) {
    assert.ok(readFileSync(`${root}/${name}`, 'utf8').includes('/inside-the-repair'), name);
  }
  const css = readFileSync(`${root}/assets/css/repair-explorer.css`, 'utf8');
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('.rx-main:not(.rx-ready)'));
});
