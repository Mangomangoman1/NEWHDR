/* Ask the bench: question form on the Repair Library pages.
   Sends through the site's Formspree form (same inbox as quote requests).
   Spam guards: Formspree's _gotcha honeypot, a minimum fill time, a link cap,
   and a per-browser cooldown. Without JavaScript the form posts to Formspree directly. */
(function (root) {
  'use strict';

  var MIN_FILL_MS = 4000;          // bots submit instantly; people don't
  var COOLDOWN_MS = 60 * 1000;     // one question a minute per browser
  var DAILY_LIMIT = 3;             // and three a day
  var DAY_MS = 24 * 60 * 60 * 1000;
  var MIN_SYMPTOM = 20;
  var MAX_LINKS = 2;
  var STORE_KEY = 'hdr-ask-bench';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function countLinks(text) {
    return (String(text).match(/https?:\/\/|www\./gi) || []).length;
  }

  function validate(values) {
    var errors = {};
    if (!values.device) errors.device = true;
    if (String(values.symptom || '').trim().length < MIN_SYMPTOM) errors.symptom = true;
    if (!EMAIL_RE.test(String(values.email || '').trim())) errors.email = true;
    return errors;
  }

  // 'bot' -> pretend success without sending; 'links' / 'cooldown' / 'daily' -> tell the visitor.
  function spamVerdict(values, openedAt, now, history) {
    if (values._gotcha) return 'bot';
    if (now - openedAt < MIN_FILL_MS) return 'bot';
    if (countLinks(values.symptom) + countLinks(values.tried) > MAX_LINKS) return 'links';
    var recent = (history || []).filter(function (t) { return now - t < DAY_MS; });
    if (recent.some(function (t) { return now - t < COOLDOWN_MS; })) return 'cooldown';
    if (recent.length >= DAILY_LIMIT) return 'daily';
    return null;
  }

  function buildPayload(values, page) {
    var device = values.device || 'Device';
    var model = String(values.model || '').trim();
    return {
      _subject: 'Ask the bench: ' + device + (model ? ' · ' + model : ''),
      form: 'Ask the bench',
      email: String(values.email).trim(),
      device: device,
      model: model || 'Not given',
      symptom: String(values.symptom).trim(),
      tried: String(values.tried || '').trim() || 'Not given',
      publish: values.keep_private ? 'No, answer privately only' : 'OK to publish without name or email',
      page: page || ''
    };
  }

  var api = { validate: validate, spamVerdict: spamVerdict, buildPayload: buildPayload, countLinks: countLinks,
    MIN_FILL_MS: MIN_FILL_MS, COOLDOWN_MS: COOLDOWN_MS, DAILY_LIMIT: DAILY_LIMIT };
  root.HDRAskBench = api;

  var doc = root.document;
  if (!doc || !doc.querySelectorAll) return;

  function readHistory() {
    try { var v = JSON.parse(root.localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeHistory(list) {
    try { root.localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-10))); } catch (e) { /* private mode */ }
  }

  var MESSAGES = {
    links: 'Please leave out links. Describe what you see instead, and I’ll ask for anything else I need.',
    cooldown: 'Your last question just came through. Give it a minute before sending another.',
    daily: 'You’ve sent a few questions today. If it’s urgent, text <a href="sms:+12084501606">208-450-1606</a>.',
    failed: 'That didn’t send. Try again, or text <a href="sms:+12084501606">208-450-1606</a> or email <a href="mailto:samuel@haileyrepair.com">samuel@haileyrepair.com</a>.'
  };

  function setup(form) {
    var openedAt = Date.now();
    var body = form.querySelector('[data-ab-body]');
    var done = form.querySelector('[data-ab-done]');
    var status = form.querySelector('[data-ab-status]');
    var button = form.querySelector('button[type="submit"]');
    var label = form.querySelector('[data-ab-label]');
    var symptom = form.elements.symptom;
    var counter = form.querySelector('[data-ab-count]');
    var devices = form.querySelector('.ab-devices');
    var ticket = form.querySelector('[data-ab-ticket]');
    var busy = false;

    function updateCount() {
      if (!counter || !symptom) return;
      var n = symptom.value.trim().length;
      counter.textContent = n === 0 ? '' : (n < MIN_SYMPTOM ? (MIN_SYMPTOM - n) + ' more' : n + ' / 2000');
      counter.classList.toggle('is-ready', n >= MIN_SYMPTOM);
    }

    function values() {
      var el = form.elements;
      var checked = form.querySelector('input[name="device"]:checked');
      return {
        device: checked ? checked.value : '',
        model: el.model.value, symptom: el.symptom.value, tried: el.tried.value,
        email: el.email.value, keep_private: el.keep_private.checked, _gotcha: el._gotcha.value
      };
    }

    function showError(name, on) {
      var err = form.querySelector('#ab-' + name + '-error');
      if (err) err.hidden = !on;
      if (name === 'device') {
        if (on) devices.setAttribute('data-invalid', ''); else devices.removeAttribute('data-invalid');
      } else {
        var input = form.elements[name];
        if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
      }
    }

    function showStatus(key) {
      status.innerHTML = MESSAGES[key];
      status.hidden = false;
    }

    function finish(email) {
      var out = form.querySelector('[data-ab-email]');
      if (out) out.textContent = email;
      if (ticket) ticket.textContent = String(Date.now()).slice(-5);
      body.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }

    function setBusy(on) {
      busy = on;
      button.disabled = on;
      form.setAttribute('aria-busy', on ? 'true' : 'false');
      if (label) label.textContent = on ? 'Sending…' : 'Send to the bench';
    }

    if (symptom) symptom.addEventListener('input', updateCount);
    form.addEventListener('input', function (e) {
      var name = e.target && e.target.name;
      if (!name) return;
      var errs = validate(values());
      if (name === 'device' || name === 'symptom' || name === 'email') {
        var err = form.querySelector('#ab-' + name + '-error');
        if (err && !err.hidden && !errs[name]) showError(name, false);
      }
    });
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'device') showError('device', false);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      status.hidden = true;
      var v = values();
      var errs = validate(v);
      ['device', 'symptom', 'email'].forEach(function (k) { showError(k, !!errs[k]); });
      if (errs.device || errs.symptom || errs.email) {
        var first = errs.device ? form.querySelector('input[name="device"]') : form.elements[errs.symptom ? 'symptom' : 'email'];
        if (first) first.focus();
        return;
      }
      var now = Date.now();
      var history = readHistory();
      var verdict = spamVerdict(v, openedAt, now, history);
      if (verdict === 'bot') { finish(String(v.email).trim()); return; }
      if (verdict) { showStatus(verdict); return; }

      setBusy(true);
      root.fetch('https://formspree.io/f/' + form.dataset.formspree, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(buildPayload(v, root.location ? root.location.pathname : ''))
      }).then(function (res) {
        if (!res.ok) throw new Error('send failed');
        history.push(now);
        writeHistory(history);
        setBusy(false);
        finish(String(v.email).trim());
      }).catch(function () {
        setBusy(false);
        showStatus('failed');
      });
    });

    updateCount();
  }

  Array.prototype.forEach.call(doc.querySelectorAll('form[data-ask-bench]'), setup);
})(typeof window !== 'undefined' ? window : globalThis);
