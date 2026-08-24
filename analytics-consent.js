// Load analytics only after the visitor has explicitly accepted it.
(function () {
  'use strict';

  var measurementId = 'G-SGQ617V748';
  var consentKey = 'hdr_cookie_consent';
  var disableKey = 'ga-disable-' + measurementId;
  var loaded = false;

  function getConsent() {
    try { return localStorage.getItem(consentKey); } catch (error) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(consentKey, value); } catch (error) {}
  }

  function loadAnalytics() {
    if (loaded || getConsent() !== 'accepted') return;
    loaded = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  function acceptAnalytics() {
    setConsent('accepted');
    loadAnalytics();
  }

  function declineAnalytics() {
    setConsent('declined');
    window[disableKey] = true;
  }

  function bindConsentControls() {
    var accept = document.getElementById('cookieAccept');
    var decline = document.getElementById('cookieDecline');
    if (accept) accept.addEventListener('click', acceptAnalytics);
    if (decline) decline.addEventListener('click', declineAnalytics);
  }

  if (getConsent() === 'accepted') loadAnalytics();
  else window[disableKey] = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindConsentControls, { once: true });
  } else {
    bindConsentControls();
  }
})();
