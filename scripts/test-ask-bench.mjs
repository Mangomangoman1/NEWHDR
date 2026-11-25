import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const code = readFileSync(new URL('assets/ask-bench.js', root), 'utf8');
const context = {};
vm.runInNewContext(code, context); // no document: only the pure helpers load
const A = context.HDRAskBench;

const good = { device: 'Laptop', model: 'MacBook Pro 2017', symptom: 'Bars of light along the bottom of the screen when the lid opens past halfway.', tried: '', email: 'jane@example.com', keep_private: false, _gotcha: '' };

test('a complete question validates', () => {
  assert.deepEqual({ ...A.validate(good) }, {});
});

test('missing device, short symptom and bad email are caught', () => {
  const errs = A.validate({ ...good, device: '', symptom: 'dead', email: 'jane@' });
  assert.equal(errs.device, true); assert.equal(errs.symptom, true); assert.equal(errs.email, true);
});

test('honeypot and instant submits are treated as bots', () => {
  const now = 1_000_000;
  assert.equal(A.spamVerdict({ ...good, _gotcha: 'x' }, now - 60_000, now, []), 'bot');
  assert.equal(A.spamVerdict(good, now - 1000, now, []), 'bot');
  assert.equal(A.spamVerdict(good, now - 60_000, now, []), null);
});

test('link stuffing is refused', () => {
  const now = 1_000_000;
  const spam = { ...good, symptom: 'buy now https://a.example https://b.example www.c.example cheap' };
  assert.equal(A.spamVerdict(spam, now - 60_000, now, []), 'links');
});

test('per-browser cooldown and daily cap', () => {
  const now = 10 * 24 * 3600_000;
  assert.equal(A.spamVerdict(good, now - 60_000, now, [now - 30_000]), 'cooldown');
  assert.equal(A.spamVerdict(good, now - 60_000, now, [now - 3 * 3600_000, now - 2 * 3600_000, now - 3600_000]), 'daily');
  assert.equal(A.spamVerdict(good, now - 60_000, now, [now - 2 * 24 * 3600_000]), null);
});

test('payload carries the subject, reply email and publish choice', () => {
  const p = A.buildPayload({ ...good, keep_private: true }, '/tips/laptop-hinge-breaking');
  assert.equal(p._subject, 'Ask the bench: Laptop · MacBook Pro 2017');
  assert.equal(p.email, 'jane@example.com');
  assert.match(p.publish, /privately/);
  assert.equal(p.page, '/tips/laptop-hinge-breaking');
  assert.equal(A.buildPayload({ ...good, model: '' }, '')._subject, 'Ask the bench: Laptop');
});

test('the hub and every tips page carry one box with its assets', () => {
  const pages = ['tips.html', ...readdirSync(new URL('tips/', root)).filter(f => f.endsWith('.html')).map(f => 'tips/' + f)];
  for (const page of pages) {
    const html = readFileSync(new URL(page, root), 'utf8');
    assert.equal(html.split('<!-- ask-bench:start -->').length, 2, page + ' should have exactly one box');
    assert.ok(html.includes('/assets/css/ask-bench.css'), page + ' loads the stylesheet');
    assert.ok(html.includes('/assets/ask-bench.js'), page + ' loads the script');
    assert.ok(html.indexOf('<!-- ask-bench:end -->') < html.indexOf('</main>'), page + ' keeps the box inside main');
    assert.ok(html.includes('name="_gotcha"'), page + ' has the honeypot');
  }
});
