import fs from 'node:fs';
import { scenes } from '../assets/repair-explorer-data.js';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const contact = fs.readFileSync('contact.html', 'utf8');
const nav = contact.slice(contact.indexOf('<nav class="nav"'), contact.indexOf('<!-- Page load curtain -->')).trim();
const footer = contact.slice(contact.indexOf('<footer class="footer"'), contact.indexOf('<!-- Cookie Banner -->')).replaceAll(' data-animate=""', '').replace('<a href="/device-check">Device Check</a>', '<a href="/inside-the-repair">Inside the Repair</a>\n<a href="/device-check">Device Check</a>');
if (!nav.startsWith('<nav') || !footer.endsWith('\n')) throw new Error('Shared page shell markers have changed.');
const panels = scenes.map((scene, index) => `<section class="rx-scene" id="scene-${scene.id}" aria-label="${scene.name}">
  <div class="rx-workbench">
    <div class="rx-photo" data-photo="${scene.id}">
      <div class="rx-plane">
      <img src="${scene.image}" width="${scene.width}" height="${scene.height}" alt="${scene.alt}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"/>
      <div class="rx-pins" aria-label="Explore ${scene.name} parts">${scene.parts.map((part,i)=>`<button type="button" class="rx-pin" data-part="${part.id}" aria-controls="part-${scene.id}-${part.id}" aria-label="${i+1}. ${part.name}" aria-pressed="false" style="--pin-x:${part.x}%;--pin-y:${part.y}%"><span>${String(i+1).padStart(2,'0')}</span><span class="rx-pin-name">${part.name}</span></button>`).join('')}</div>
      </div>
      <span class="rx-photo-corner" aria-hidden="true">HDR / UNDER THE COVER</span>
    </div>
    <div class="rx-photo-bar"><span>${scene.label}</span><button type="button" class="rx-zoom" data-zoom aria-pressed="false"><span aria-hidden="true">⊕</span> Look closer</button></div>
  </div>
  <div class="rx-inspector">
    <div class="rx-parts" role="group" aria-label="${scene.name} components">${scene.parts.map((part,i)=>`<button type="button" data-part="${part.id}" aria-controls="part-${scene.id}-${part.id}" aria-pressed="false"><span>${String(i+1).padStart(2,'0')}</span>${part.name}</button>`).join('')}</div>
    <div class="rx-stories">${scene.parts.map((part,i)=>`<article class="rx-story" id="part-${scene.id}-${part.id}" data-story="${part.id}"><p class="rx-eyebrow">${part.tag}</p><h2>${part.title}</h2><p>${part.body}</p><div class="rx-detail"><h3>A closer look</h3><p>${part.detail}</p></div><p class="rx-fact"><span aria-hidden="true">↳</span>${part.fact}</p></article>`).join('')}</div>
    <div class="rx-pagination"><span data-counter>01 / 04</span><div><button type="button" data-direction="-1" aria-label="Previous component">←</button><button type="button" data-direction="1" aria-label="Next component">→</button></div></div>
    <a class="rx-service" href="${scene.link}">${scene.linkText}<span aria-hidden="true">↗</span></a>
  </div>
</section>`).join('\n');
const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Inside the Repair — Explore the Hardware | Hailey Device Repair</title>
<meta name="description" content="Take a closer look inside a MacBook and PlayStation 5. Explore real hardware photos, discover what the parts do, and see the detail behind device repair at HDR."/>
<link rel="canonical" href="https://www.haileyrepair.com/inside-the-repair"/>
<meta property="og:title" content="Inside the Repair | Hailey Device Repair"/>
<meta property="og:description" content="Small parts. A closer look. Explore the hardware behind your everyday devices."/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://www.haileyrepair.com/inside-the-repair"/>
<meta property="og:image" content="https://www.haileyrepair.com/assets/hero/repair-bench-macbook.webp"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="theme-color" content="#0b0f14"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=MuseoModerno:wght@400&display=swap"/>
<link rel="stylesheet" href="/assets/css/material-symbols.css"/>
<link rel="stylesheet" href="/style.min.css?v=stage-parallax-20260702"/>
<link rel="stylesheet" href="/nav-quote.css?v=20260709"/>
<link rel="stylesheet" href="/assets/css/repair-explorer.css?v=20260905"/>
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:'Inside the Repair',description:'A photographic exploration of MacBook and PlayStation 5 hardware.',url:'https://www.haileyrepair.com/inside-the-repair',isPartOf:{'@type':'WebSite',name:'Hailey Device Repair',url:'https://www.haileyrepair.com'}})}</script>
<script src="/main.min.js?v=explorer-20260905-2" defer></script>
<script src="/liquid-btn.js" defer></script>
<script src="/analytics-consent.js" defer></script>
<script type="module" src="/assets/repair-explorer.js?v=20260905"></script>
</head><body class="repair-explorer-page">
${nav}
<a class="skip-link" href="#main">Skip to main content</a>
<main id="main" class="rx-main">
<header class="rx-heading"><div><a class="rx-eyebrow" href="/about">Hailey Device Repair / From the bench</a><h1>Inside the repair<span>.</span></h1><p>A closer look at the parts that keep your everyday devices going.</p></div><div class="rx-heading-note"><span aria-hidden="true">↙</span><p>Pick a part.<br/>See the bigger picture.</p></div></header>
<div class="rx-toolbar"><div class="rx-scene-switch" role="group" aria-label="Choose a device">${scenes.map((scene,i)=>`<button type="button" data-scene="${scene.id}" aria-pressed="${i===0}"><span aria-hidden="true">0${i+1}</span>${scene.name}</button>`).join('')}</div><button type="button" class="rx-share" id="rx-share">Copy link to this part <span aria-hidden="true">↗</span></button></div>
<div class="rx-announcement" role="status" aria-live="polite" id="rx-status"></div>
<div id="rx-copy-fallback" hidden><label for="rx-link">Copy this link</label><input id="rx-link" type="text" readonly/></div>
<div class="rx-explorer">${panels}</div>
<div class="rx-footnote"><p>Hardware varies by model. These photos show the devices pictured, with their covers removed.</p><a href="#about-the-tour">About this tour <span aria-hidden="true">↓</span></a></div>
<section class="rx-end" id="about-the-tour"><div><p class="rx-eyebrow">The detail makes the difference</p><h2>Good repair starts<br/>with understanding.</h2></div><div><p>There’s a lot between a broken device and a working one. This tour gives you a closer look at that world—from a battery assembly to the tiny connections on a circuit board.</p><p>For your own device, talk with Samuel. You’ll get an explanation of the work and a quote before it begins.</p><a class="rx-contact" href="/contact">Talk to the person doing the repair <span aria-hidden="true">↗</span></a><details class="rx-sources"><summary>Hardware references</summary><p>Component background: <a href="https://support.apple.com/en-la/121128">Apple’s MacBook Pro repair documentation</a> and <a href="https://blog.playstation.com/2020/10/07/ps5-teardown-an-inside-look-at-our-most-transformative-console-yet/">Sony’s PS5 teardown</a>. Layouts differ across hardware revisions.</p></details></div></section>
</main>
${footer}
<div class="qf-overlay" id="qfOverlay"></div>
<div aria-label="Cookie consent" class="cookie-banner" id="cookieBanner" role="dialog"><p class="cookie-banner-text">Minimal cookies for preferences and basic site analytics. <a href="/privacy">Learn more</a></p><div class="cookie-banner-actions"><button class="btn-accept" id="cookieAccept">Got it</button><button class="btn-decline" id="cookieDecline">Decline</button></div></div>
</body></html>`;
fs.writeFileSync('inside-the-repair.html',html);
