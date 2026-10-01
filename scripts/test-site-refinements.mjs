import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = file => readFileSync(new URL(file, root), 'utf8');
const main = source('main.js');
function element(attributes = {}) {
  const classes = new Set(), handlers = {};
  let text = '';
  return {
    attributes: { ...attributes }, handlers, style: {}, dataset: {}, hidden: false, value: '', writes: 0,
    get textContent() { return text; }, set textContent(value) { text = String(value); this.writes++; },
    classList: {
      add: (...values) => values.forEach(value => classes.add(value)),
      remove: (...values) => values.forEach(value => classes.delete(value)),
      contains: value => classes.has(value),
      toggle(value, on) { if (on) classes.add(value); else classes.delete(value); }
    },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    getAttribute(key) { this.reads = (this.reads || 0) + 1; return this.attributes[key] ?? null; },
    hasAttribute(key) { return key in this.attributes; },
    addEventListener(type, callback) { (handlers[type] ||= []).push(callback); },
    emit(type, event = {}) { for (const callback of handlers[type] || []) callback.call(this, event); },
    focus() { this.focused = true; }, scrollIntoView(options) { this.scrollOptions = options; },
    querySelectorAll() { return []; }
  };
}
const event = key => ({ key, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } });

function library({ reduced = true } = {}) {
  const input = element(), number = element(), label = element(), empty = element(), form = element(), section = element();
  const phone = element({ 'data-category': 'phone', 'data-search': 'café microphone' }); phone.textContent = 'Phone guide';
  const laptop = element({ 'data-category': 'computer', 'data-search': 'keyboard' }); laptop.textContent = 'Laptop guide';
  const guides = [phone, laptop], group = element(); group.querySelectorAll = () => guides.filter(g => !g.hidden);
  const buttons = ['all', 'phone', 'computer'].map(value => element({ 'data-resource-filter': value }));
  const reveal = element(), motion = { matches: reduced }, observers = [];
  const ids = { resourceSearch: form, resourceSearchInput: input, resourceResultNumber: number, resourceResultLabel: label, resourceEmpty: empty, library: section };
  const document = { documentElement: element(), getElementById: id => ids[id], querySelectorAll: selector => ({ '[data-resource-filter]': buttons, '[data-guide]': guides, '[data-guide-group]': [group], '.rh-reveal': [reveal] }[selector] || []) };
  class Observer { constructor(callback) { observers.push(callback); } observe() {} unobserve() {} }
  vm.runInNewContext(source('assets/tips-hub.js'), { document, window: { matchMedia: () => motion, IntersectionObserver: Observer }, IntersectionObserver: Observer });
  return { input, number, label, empty, form, section, phone, laptop, group, buttons, reveal, observers, motion };
}
test('library matches accents, caches guide metadata, and does not repeat unchanged count writes', () => {
  const s = library(), initialReads = s.phone.reads;
  s.input.value = 'cafe'; s.input.emit('input');
  assert.equal(s.phone.hidden, false); assert.equal(s.laptop.hidden, true);
  assert.equal(s.number.textContent, '1'); assert.equal(s.label.textContent, 'guide');
  const writes = s.number.writes;
  s.input.emit('input'); assert.equal(s.number.writes, writes); assert.equal(s.phone.reads, initialReads);
});
test('library waits for composition and Escape clears only the query', () => {
  const s = library(); s.buttons[1].emit('click');
  s.input.emit('compositionstart'); s.input.value = 'missing'; s.input.emit('input', { isComposing: true });
  assert.equal(s.phone.hidden, false);
  s.input.emit('compositionend'); assert.equal(s.phone.hidden, true); assert.equal(s.empty.hidden, false); assert.equal(s.group.hidden, true);
  const escape = event('Escape'); s.input.emit('keydown', escape);
  assert.equal(escape.prevented, true); assert.equal(s.input.value, '');
  assert.equal(s.phone.hidden, false); assert.equal(s.laptop.hidden, true); assert.equal(s.empty.hidden, true);
});
test('library reduced motion skips reveal observers and disables smooth navigation', () => {
  const s = library(); assert.equal(s.observers.length, 0); assert.equal(s.reveal.classList.contains('is-visible'), true);
  s.form.emit('submit', event()); assert.equal(s.section.scrollOptions.behavior, 'instant');
  s.motion.matches = false; s.buttons[1].emit('click'); assert.equal(s.section.scrollOptions.behavior, 'smooth');
});

function progress() {
  const bar = element(), root = { scrollHeight: 1200, clientHeight: 200, scrollTop: -20 }, frames = [];
  const window = element(), document = element();
  window.matchMedia = () => ({ matches: true }); window.requestAnimationFrame = callback => frames.push(callback);
  document.documentElement = root; document.querySelector = () => bar;
  vm.runInNewContext(source('assets/repair-tip-pages.js'), { window, document });
  return { bar, root, frames, window, document, flush() { frames.splice(0).forEach(callback => callback()); } };
}
test('article progress clamps overscroll and batches scroll events into one frame', () => {
  const s = progress(); assert.equal(s.bar.style.width, '0%');
  s.root.scrollTop = 1100; s.window.emit('scroll'); s.window.emit('scroll');
  assert.equal(s.frames.length, 1); s.flush(); assert.equal(s.bar.style.width, '100%');
  s.root.scrollTop = 500; s.window.emit('scroll'); s.flush(); assert.equal(s.bar.style.width, '50%');
});
test('article progress updates after resize, media load and cache restoration', () => {
  const s = progress(); s.root.scrollTop = 500;
  for (const [target, type] of [[s.window, 'resize'], [s.window, 'load'], [s.document, 'load'], [s.window, 'pageshow']]) {
    s.root.scrollHeight += 100; target.emit(type); s.flush();
    assert.equal(s.bar.style.width, (500 / (s.root.scrollHeight - 200) * 100) + '%');
  }
});

test('anchors resolve encoded IDs and leave modified or malformed clicks to the browser', () => {
  const code = main.slice(main.indexOf('  // ─── Smooth anchor'), main.indexOf('  // ─── Active nav'));
  const anchor = element({ href: '#repair%20guide' }), target = element(), scrolls = [], document = { querySelectorAll: () => [anchor], getElementById: id => id === 'repair guide' ? target : null };
  target.getBoundingClientRect = () => ({ top: 200 });
  vm.runInNewContext(code, { document, window: { scrollY: 20, scrollTo: options => scrolls.push(options) }, nav: { offsetHeight: 64 }, reduceMotion: true, location: { hash: '' }, history: { pushState() {} } });
  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) anchor.emit('click', { ...event(), [modifier]: true });
  assert.equal(scrolls.length, 0);
  anchor.emit('click', event()); assert.equal(target.focused, true); assert.equal(scrolls[0].top, 140);
  anchor.attributes.href = '#%invalid'; assert.doesNotThrow(() => anchor.emit('click', event())); assert.equal(scrolls.length, 1);
});

function quickFind() {
  const ids = Object.fromEntries(['qfOverlay', 'qfSearch', 'qfClose', 'qfBackdrop', 'qfEmpty', 'qfBrowse', 'qfResults', 'qfRailNav', 'qfStatus', 'qfTrigger', 'qfTriggerMobile'].map(id => [id, Object.assign(element(), { id })]));
  const drawers = [0, 1, 2].map(i => element({ 'data-drawer': String(i) })), panels = drawers.map(() => element());
  drawers.forEach(d => { d.closest = () => d; });
  ids.qfOverlay.querySelectorAll = selector => selector === '.qf-drawer' ? drawers : selector === '.qf-drawerpanel' ? panels : [];
  const document = element(); document.getElementById = id => ids[id] || null; document.body = element(); document.body.style.overflow = 'clip';
  const window = element(), media = element(); media.matches = false; window.matchMedia = () => media;
  const code = main.slice(main.indexOf('(function() {', main.indexOf('   QUICK FIND')));
  vm.runInNewContext(code, { document, window });
  return { ids, drawers, panels, document, media };
}
test('Quick Find exposes dialog state and restores prior overflow after closing', () => {
  const s = quickFind(); assert.equal(s.ids.qfTrigger.attributes['aria-controls'], 'qfOverlay');
  s.ids.qfTrigger.emit('click'); assert.equal(s.document.body.style.overflow, 'hidden');
  assert.equal(s.ids.qfTrigger.attributes['aria-expanded'], 'true');
  s.ids.qfTrigger.emit('click'); s.ids.qfClose.emit('click');
  assert.equal(s.document.body.style.overflow, 'clip'); assert.equal(s.ids.qfTrigger.attributes['aria-expanded'], 'false');
  s.ids.qfClose.emit('click'); assert.equal(s.document.body.style.overflow, 'clip');
});
test('Quick Find categories follow desktop/mobile orientation with Home, End and wrapping arrows', () => {
  const s = quickFind(), rail = s.ids.qfRailNav;
  assert.equal(rail.attributes['aria-orientation'], 'vertical');
  const key = value => { const e = { ...event(value), target: s.drawers[0] }; rail.emit('keydown', e); return e; };
  assert.equal(key('ArrowDown').stopped, true); assert.equal(s.drawers[1].attributes['aria-selected'], 'true');
  key('End'); assert.equal(s.drawers[2].tabIndex, 0); assert.equal(s.panels[0].hasAttribute('hidden'), true);
  key('ArrowDown'); assert.equal(s.drawers[0].tabIndex, 0);
  s.media.matches = true; s.media.emit('change'); assert.equal(rail.attributes['aria-orientation'], 'horizontal');
  key('ArrowLeft'); assert.equal(s.drawers[2].tabIndex, 0); key('Home'); assert.equal(s.drawers[0].tabIndex, 0);
});

test('mobile navigation resets its scroll lock before back/forward caching', () => {
  const code = main.slice(main.indexOf('  // ─── Nav: scroll shadow'), main.indexOf('  // ─── Scroll animations'));
  const menu = element(), toggle = element(), backdrop = element(), link = element(), body = element(), window = element(), document = element();
  menu.id = 'navMobile'; menu.querySelector = () => link; menu.querySelectorAll = () => [link];
  document.body = body; document.getElementById = id => ({ navMobile: menu, navHamburger: toggle, navBackdrop: backdrop }[id] || null);
  window.matchMedia = () => element();
  vm.runInNewContext(code, { document, window });
  toggle.emit('click'); assert.equal(body.classList.contains('menu-open'), true);
  window.emit('pagehide'); assert.equal(body.classList.contains('menu-open'), false); assert.equal(menu.hidden, true); assert.equal(toggle.attributes['aria-expanded'], 'false');
});

test('footer restores its poster after blocked playback and pauses on pagehide', async () => {
  const scene = element(), video = element(), toggle = element(), window = element(), document = element();
  let observe;
  video.paused = true; video.dataset.src = '/animation.mp4'; video.play = () => Promise.reject(new Error('blocked'));
  video.hasAttribute = key => key === 'src' && !!video.src; video.pause = () => { video.pauses = (video.pauses || 0) + 1; };
  scene.querySelector = selector => selector === 'video' ? video : toggle;
  document.querySelector = () => scene; window.matchMedia = () => Object.assign(element(), { matches: false });
  class Observer { constructor(callback) { observe = callback; } observe() {} }
  vm.runInNewContext(source('assets/footer-clay.js'), { document, window: Object.assign(window, { IntersectionObserver: Observer }), navigator: {}, IntersectionObserver: Observer });
  scene.classList.add('has-video'); observe([{ isIntersecting: true, intersectionRatio: 1 }]);
  await Promise.resolve(); assert.equal(scene.classList.contains('has-video'), false); assert.equal(toggle.textContent, 'Play');
  const pauses = video.pauses || 0; window.emit('pagehide'); assert.equal(video.pauses, pauses + 1);
});

test('Save-Data retains the homepage illustration without loading a 3D scene', () => {
  const aside = element();
  vm.runInNewContext(source('assets/repair-ballet.js'), { document: { getElementById: () => aside }, navigator: { connection: { saveData: true } }, window: {} });
  assert.equal(aside.dataset.state, 'unavailable');
});
