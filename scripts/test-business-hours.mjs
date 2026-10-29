import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const main = readFileSync(new URL('main.js', root), 'utf8');
const clockSections = [
  main.slice(main.indexOf('// Hero status clock'), main.indexOf('// ─── Float Labels')),
  main.slice(main.indexOf('// Hero open/closed status clock'), main.indexOf('/* ═══════════════════════════════════════════\n   REPAIR SOS'))
];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function publicHtml(dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['archived', 'docs', 'scripts'].includes(entry.name)) return [];
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    return entry.isDirectory() ? publicHtml(url) : entry.name.endsWith('.html') ? [url] : [];
  });
}
function walk(value, inspect) {
  if (!value || typeof value !== 'object') return;
  inspect(value);
  for (const child of Object.values(value)) walk(child, inspect);
}

test('every published opening-hours schedule covers all seven days with the corrected local hours', () => {
  let schedules = 0;
  for (const url of publicHtml()) {
    const html = readFileSync(url, 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      walk(JSON.parse(match[1]), node => {
        if (!node.openingHoursSpecification) return;
        schedules++;
        const actual = new Map();
        for (const range of node.openingHoursSpecification) {
          const rangeDays = Array.isArray(range.dayOfWeek) ? range.dayOfWeek : [range.dayOfWeek];
          for (const day of rangeDays) {
            const name = day.replace(/^https?:\/\/schema.org\//, '');
            assert.ok(!actual.has(name), `duplicate ${name} in ${url.pathname}`);
            actual.set(name, [range.opens, range.closes]);
          }
        }
        assert.equal(actual.size, 7, url.pathname);
        for (const [index, day] of days.entries()) {
          assert.deepEqual(actual.get(day), index < 5 ? ['10:30', '20:30'] : ['12:00', '19:00'], `${url.pathname}: ${day}`);
        }
      });
    }
  }
  assert.ok(schedules > 0, 'no structured business hours found');
});

test('customer-facing weekly hours and the no-JS homepage fallback have no stale opening times', () => {
  for (const url of publicHtml()) {
    const text = readFileSync(url, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/&ndash;|&mdash;/g, '–').replace(/<[^>]*>/g, ' ');
    assert.doesNotMatch(text, /Mon(?:day)?[–-]Fri(?:day)?,?\s+9(?:\s*am|\s*AM)?\s*[–-]\s*9(?:\s*pm|\s*PM)?/i, url.pathname);
    assert.doesNotMatch(text, /(?:Sat(?:urday)?[–-]Sun(?:day)?|weekends)\s+11(?:\s*am|\s*AM)?\s*[–-]\s*7(?:\s*pm|\s*PM)?/i, url.pathname);
  }
  const home = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(home, /id="heroClock">Mon–Fri, 10:30 am–8:30 pm<\/span>/);
  const summary = readFileSync(new URL('llms-full.txt', root), 'utf8');
  assert.match(summary, /Monday-Friday 10:30 AM-8:30 PM Mountain Time; Saturday-Sunday 12 PM-7 PM Mountain Time/);
});

function runClock(code, instant) {
  let current = instant;
  const timers = [];
  const elements = Object.fromEntries(['statusDot', 'statusText', 'statusTime', 'heroClock', 'heroStatusDot'].map(id => {
    const classes = new Set();
    return [id, { className: '', textContent: '', classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v) } }];
  }));
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [current])); } }
  vm.runInNewContext(code, { Date: ClockDate, Intl, document: { getElementById: id => elements[id] }, setInterval(fn, ms) { assert.equal(ms, 60000); timers.push(fn); } });
  return { elements, tick(instant) { current = instant; timers.forEach(fn => fn()); } };
}
function assertState(clock, index, expected) {
  if (index === 0) {
    assert.equal(clock.elements.statusText.textContent, expected === 'closed' ? 'Currently closed' : expected === 'closing' ? 'Closing soon' : 'Open now');
    assert.equal(clock.elements.statusDot.className, 'status-dot' + (expected === 'closed' ? ' closed' : expected === 'closing' ? ' closing-soon' : ''));
  } else {
    assert.equal(clock.elements.heroClock.textContent, expected === 'closed' ? 'Closed now' : expected === 'closing' ? 'Closing soon' : 'Open now');
    assert.equal(clock.elements.heroStatusDot.classList.contains('closed'), expected === 'closed');
    assert.equal(clock.elements.heroStatusDot.classList.contains('closing-soon'), expected === 'closing');
  }
}
for (const [index, code] of clockSections.entries()) {
  test(`clock ${index + 1} honors minute boundaries on every weekday/weekend in winter and summer Mountain Time`, () => {
    assert.ok(code.length > 500);
    // These Mondays use standard time (UTC-7) and daylight time (UTC-6).
    for (const season of [{ monday: '2026-11-02', offset: 7 }, { monday: '2026-06-01', offset: 6 }]) {
      for (let day = 0; day < 7; day++) {
        const weekend = day >= 5;
        const samples = weekend
          ? [[0,0,'closed'],[11,59,'closed'],[12,0,'open'],[18,29,'open'],[18,30,'closing'],[18,59,'closing'],[19,0,'closed'],[23,59,'closed']]
          : [[0,0,'closed'],[9,0,'closed'],[10,29,'closed'],[10,30,'open'],[19,59,'open'],[20,0,'closing'],[20,29,'closing'],[20,30,'closed'],[23,59,'closed']];
        for (const [hour, minute, state] of samples) {
          const instant = new Date(`${season.monday}T00:00:00Z`).getTime() + ((day * 24 + hour + season.offset) * 60 + minute) * 60000;
          const clock = runClock(code, instant);
          assertState(clock, index, state);
        }
      }
    }
  });
  test(`clock ${index + 1} refreshes from closed through open and closing-soon without leaving stale status`, () => {
    const clock = runClock(code, Date.parse('2026-10-29T16:29:00Z')); // Thursday, 10:29 MDT
    assertState(clock, index, 'closed');
    for (const [instant, expected] of [['2026-10-29T16:30:00Z','open'],['2026-10-30T02:00:00Z','closing'],['2026-10-30T02:30:00Z','closed'],['2026-10-30T16:30:00Z','open']]) {
      clock.tick(Date.parse(instant)); assertState(clock, index, expected);
    }
  });
}
