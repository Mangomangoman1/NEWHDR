import { scenes, selectionFromHash, cameraFor } from './repair-explorer-data.js';

const root = document.querySelector('.rx-main');
if (root) {
  let { scene, part } = selectionFromHash(window.location.hash);
  let zoomed = false;
  const status = document.getElementById('rx-status');
  const share = document.getElementById('rx-share');
  const fallback = document.getElementById('rx-copy-fallback');
  let shareTimer;

  function render({ announce = true, updateURL = true } = {}) {
    root.querySelectorAll('[data-scene]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.scene === scene.id));
    });
    scenes.forEach(candidate => {
      const section = document.getElementById(`scene-${candidate.id}`);
      section.hidden = candidate !== scene;
      if (candidate !== scene) return;
      const camera = cameraFor(part, zoomed ? 2 : 1);
      section.querySelector('.rx-photo img').style.transform = `translate(${camera.x}%, ${camera.y}%) scale(${camera.zoom})`;
      section.querySelectorAll('[data-part]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.part === part.id));
      });
      section.querySelectorAll('.rx-pin').forEach(pin => {
        const point = scene.parts.find(item => item.id === pin.dataset.part);
        const x = point.x * camera.zoom + camera.x;
        const y = point.y * camera.zoom + camera.y;
        pin.style.left = `${x}%`;
        pin.style.top = `${y}%`;
        // Do not leave clipped controls in the keyboard sequence at 2x.
        pin.hidden = x < 4 || x > 96 || y < 5 || y > 95;
      });
      section.querySelectorAll('[data-story]').forEach(story => {
        story.hidden = story.dataset.story !== part.id;
      });
      section.querySelector('[data-counter]').textContent = `${String(scene.parts.indexOf(part) + 1).padStart(2, '0')} / ${String(scene.parts.length).padStart(2, '0')}`;
      const zoom = section.querySelector('[data-zoom]');
      zoom.setAttribute('aria-pressed', String(zoomed));
      zoom.replaceChildren();
      const symbol = document.createElement('span');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.textContent = zoomed ? '⊖' : '⊕';
      zoom.append(symbol, zoomed ? 'Full view' : 'Look closer');
    });
    if (updateURL) {
      // Preserve normal page history; a copied URL opens this exact component.
      try { history.replaceState(null, '', `#${scene.id}-${part.id}`); } catch { /* The tour also works in restricted previews. */ }
    }
    clearTimeout(shareTimer);
    share.textContent = 'Copy link to this part ↗';
    fallback.hidden = true;
    if (announce) status.textContent = `${scene.name}: ${part.name}. ${part.title}${zoomed ? ' Close-up view.' : ''}`;
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.scene) {
      scene = scenes.find(item => item.id === button.dataset.scene);
      part = scene.parts[0];
      zoomed = false;
    } else if (button.dataset.part) {
      part = scene.parts.find(item => item.id === button.dataset.part);
    } else if (button.hasAttribute('data-zoom')) {
      zoomed = !zoomed;
    } else if (button.dataset.direction) {
      const index = (scene.parts.indexOf(part) + Number(button.dataset.direction) + scene.parts.length) % scene.parts.length;
      part = scene.parts[index];
    } else return;
    render();
  });

  root.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const button = event.target.closest('button[data-part]');
    if (!button) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? scene.parts.length - 1 : (scene.parts.indexOf(part) + direction + scene.parts.length) % scene.parts.length;
    part = scene.parts[index];
    const group = button.closest('.rx-pins, .rx-parts');
    render();
    group.querySelector(`[data-part="${part.id}"]`).focus({ preventScroll: true });
  });

  share.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.hash = `${scene.id}-${part.id}`;
    // Do not copy incidental tracking/query parameters into shared links.
    url.search = '';
    try {
      await navigator.clipboard.writeText(url.href);
      share.textContent = 'Link copied ✓';
      status.textContent = 'Link copied. It opens this component.';
      shareTimer = setTimeout(() => { share.textContent = 'Copy link to this part ↗'; }, 3000);
    } catch {
      fallback.hidden = false;
      const input = document.getElementById('rx-link');
      input.value = url.href;
      input.focus();
      input.select();
      status.textContent = 'Select and copy the link shown above the photo.';
    }
  });

  window.addEventListener('hashchange', () => {
    // Ordinary on-page anchors should retain their normal navigation behavior.
    if (!scenes.some(item => item.parts.some(p => `#${item.id}-${p.id}` === location.hash))) return;
    ({ scene, part } = selectionFromHash(location.hash));
    zoomed = false;
    render({ updateURL: false });
  });

  render({ announce: false, updateURL: false });
  root.classList.add('rx-ready');
}
