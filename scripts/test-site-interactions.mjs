import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const main = readFileSync(new URL('main.js', root), 'utf8');
const formCode = main.slice(main.indexOf('  // ─── Contact form'), main.indexOf('  // ─── Smooth anchor'));

function element(value = '') {
  const classes = new Set();
  return {
    value, hidden: true, textContent: '', innerHTML: 'Send Quote Request', disabled: false,
    dataset: {}, attributes: {}, handlers: {},
    classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v) },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    addEventListener(event, callback) { this.handlers[event] = callback; },
    scrollIntoView() {}, focus() { this.focused = true; }, dispatchEvent() {},
    querySelector() { return null; }
  };
}
function setup({ response = 'ok', fallback = false } = {}) {
  const ids = Object.fromEntries(['name', 'contact', 'issue', 'device', 'model', 'service', 'formError', 'formSuccess', 'nameError', 'contactError', 'issueError'].map(id => [id, element()]));
  for (const id of ['name', 'contact', 'issue']) Object.assign(ids[id], { id, name: id });
  const submit = element(), form = element();
  form.dataset.formspree = fallback ? '' : 'test-only';
  form.querySelector = selector => selector.includes('button[type') ? submit : Object.entries(ids).find(([id]) => selector.includes('#' + id) || selector.includes('name="' + id + '"'))?.[1] || null;
  form.querySelectorAll = selector => selector === 'select' ? [ids.device, ids.service] : [ids.name, ids.contact, ids.issue];
  form.reset = () => { for (const key of ['name', 'contact', 'issue', 'device', 'model', 'service']) ids[key].value = ''; form.resets = (form.resets || 0) + 1; };
  const requests = [], window = { location: { href: '' } };
  const context = { document: { getElementById: id => id === 'contactForm' ? form : ids[id] }, window, reduceMotion: true, Event: class {}, fetch: async (url, options) => {
    requests.push({ url, options });
    if (response === 'network') throw new Error('offline');
    return { ok: response === 'ok' };
  } };
  vm.runInNewContext(formCode, context);
  const send = async () => { form.handlers.submit({ preventDefault() {} }); await new Promise(resolve => setImmediate(resolve)); };
  const fill = () => { ids.name.value = 'Jane Smith'; ids.contact.value = 'jane@example.com'; ids.issue.value = 'Cracked screen after a drop'; };
  return { ids, form, submit, requests, window, send, fill };
}

test('empty required fields give feedback and focus without sending', async () => {
  const s = setup(); await s.send();
  assert.equal(s.requests.length, 0);
  for (const id of ['name', 'contact', 'issue']) {
    assert.equal(s.ids[id].attributes['aria-invalid'], 'true');
    assert.ok(s.ids[id + 'Error'].textContent.length > 0);
  }
  assert.equal(s.ids.name.focused, true);
});
test('phone validation rejects garbage surrounding digits and accepts normal phone/email formats', async () => {
  for (const value of ['abc 2084501606 xyz', '-------', '12 34', 'not-an-email', '1234567890123456']) {
    const s = setup(); s.fill(); s.ids.contact.value = value; await s.send(); assert.equal(s.requests.length, 0, value);
  }
  for (const value of ['(208) 450-1606', '+1 208 450 1606', 'jane+repair@example.com']) {
    const s = setup(); s.fill(); s.ids.contact.value = value; await s.send(); assert.equal(s.requests.length, 1, value);
  }
});
test('successful direct submission shows accurate persistent confirmation and clears stale state', async () => {
  const s = setup(); s.fill(); s.ids.formError.hidden = false; s.ids.formError.classList.add('visible');
  await s.send();
  assert.equal(s.ids.formSuccess.hidden, false);
  assert.match(s.ids.formSuccess.innerHTML, /Request sent/);
  assert.equal(s.ids.formError.hidden, true);
  assert.equal(s.form.resets, 1);
  assert.equal(s.submit.disabled, false);
  assert.equal(s.ids.contact.attributes['aria-invalid'], undefined);
});
test('failed submissions retain visitor details and allow retry', async () => {
  for (const response of ['network', 'error']) {
    const s = setup({ response }); s.fill(); await s.send();
    assert.equal(s.ids.formError.hidden, false);
    assert.equal(s.ids.formSuccess.hidden, true);
    assert.equal(s.ids.name.value, 'Jane Smith');
    assert.equal(s.submit.disabled, false);
  }
});
test('email-app fallback preserves details and does not claim delivery', async () => {
  const s = setup({ fallback: true }); s.fill(); await s.send();
  assert.equal(s.requests.length, 0);
  assert.match(s.window.location.href, /^mailto:/);
  assert.match(s.ids.formSuccess.innerHTML, /email app should have opened/);
  assert.equal(s.ids.name.value, 'Jane Smith');
  assert.equal(s.submit.disabled, false);
});
test('all inline classic scripts parse', () => {
  for (const folder of ['', 'tips/', 'guides/', 'mail-in/']) {
    for (const filename of readdirSync(new URL(folder || './', root)).filter(name => name.endsWith('.html'))) {
      const html = readFileSync(new URL(folder + filename, root), 'utf8');
      for (const [index, match] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
        const type = match[1].match(/type\s*=\s*["']([^"']+)/i)?.[1];
        if ((type && !['text/javascript', 'application/javascript'].includes(type)) || !match[2].trim()) continue;
        assert.doesNotThrow(() => new vm.Script(match[2]), folder + filename + ':' + index);
      }
    }
  }
});

test('Quick Find covers every sitemap route', () => {
  const code = main.slice(main.indexOf('  var QF_DATA ='), main.indexOf('  // ---- Helpers'));
  const ctx = {};
  vm.runInNewContext(code + '\nthis.routes = QF_DATA.categories.flatMap(c => c.links.map(l => l.href));', ctx);
  const sitemap = readFileSync(new URL('sitemap.xml', root), 'utf8');
  for (const match of sitemap.matchAll(/<loc>https:\/\/www\.haileyrepair\.com([^<]*)<\/loc>/g)) {
    assert.ok(ctx.routes.includes(match[1].replace(/\/$/, '') || '/'), match[1]);
  }
});

test('pricing search matches model/repair terms rather than digits in prices', () => {
  const html = readFileSync(new URL('pricing.html', root), 'utf8');
  const script = html.match(/<script id="pt-filter-js">([\s\S]*?)<\/script>/)[1];
  const rows = [...html.matchAll(/<tr data-f="([^"]+)">([\s\S]*?)<\/tr>/g)].map(match => {
    const row = element();
    row.textContent = match[2].replace(/<[^>]*>/g, '');
    row.getAttribute = () => match[1];
    row.classList.toggle = () => {};
    return row;
  });
  const input = element(), count = element(), clear = element(), empty = element();
  const ids = { ptFilter: input, ptCount: count, ptClear: clear, ptNoResults: empty };
  const category = { querySelectorAll: () => rows };
  const context = { document: { getElementById: id => ids[id], querySelectorAll: selector => selector === '.pt-table tbody tr' ? rows : selector === '.pt-cat' ? [category] : [], addEventListener() {} }, window: { addEventListener() {} } };
  vm.runInNewContext(script, context);
  input.value = 'iPhone 13 battery'; input.handlers.input();
  const matches = rows.filter(row => !row.hidden);
  assert.equal(matches.length, 4);
  assert.ok(matches.every(row => /iphone 13 (?:mini |pro |pro max )?battery/i.test(row.getAttribute())));
  input.value = 'zzzznotfound'; input.handlers.input();
  assert.equal(empty.hidden, false);
  clear.handlers.click();
  assert.equal(rows.filter(row => !row.hidden).length, rows.length);
});
