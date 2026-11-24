/* ═══════════════════════════════════════════════════
   QUOTE INTENT TRACKING
   Counts taps on text, call, email, contact, Device Check and mail-in
   links, and quote form submits, by the page they came from. Nothing
   about the visitor is sent: only the kind of tap and the page path.
   - Vercel Web Analytics: a "quote_tap" custom event (recorded where the
     plan supports custom events) and a pageview at
     /_quote/<kind>/<source page>, so the counts show in the Pages report
     on any plan.
   - Google Analytics: a "generate_lead" event, only when the visitor has
     accepted analytics (gtag exists only after consent).
   ═══════════════════════════════════════════════════ */
// Loaded on every public page; scripts/add-quote-tracking.py adds the tag.
(function () {
  'use strict';
  if (window.__hdrQuoteTracking) return;
  window.__hdrQuoteTracking = true;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

  function kindFor(link) {
    var href = (link.getAttribute('href') || '').trim().toLowerCase();
    if (href.indexOf('sms:') === 0) return 'text';
    if (href.indexOf('tel:') === 0) return 'call';
    if (href.indexOf('mailto:') === 0) return 'email';
    var path;
    try { path = new URL(href, location.href).pathname.replace(/\/+$/, ''); } catch (error) { return null; }
    if (path === '/mail-in-repair' || path.indexOf('/mail-in/') === 0) return 'mail_in';
    if (path === '/contact') return 'contact';
    if (path === '/device-check') return 'device_check';
    return null;
  }

  function send(kind) {
    var from = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (from === '/' + kind) return;
    try {
      window.va('event', { name: 'quote_tap', data: { kind: kind, from: from } });
      window.va('pageview', { route: '/_quote/' + kind, path: '/_quote/' + kind + (from === '/' ? '/home' : from) });
    } catch (error) {}
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: kind, page_path: from });
    } catch (error) {}
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var kind = kindFor(link);
    if (kind) send(kind);
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form && form.hasAttribute && form.hasAttribute('data-formspree')) send('form');
  }, true);
})();
