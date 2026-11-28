#!/usr/bin/env python3
"""Give every hardware tips page a text box near the top, with the quiet
"Not near Hailey? Mail it in" line inside it.

Eleven tips pages were built with this box in the hero. This script adds the
same box to the other templates, right after the page's direct answer (or the
symptom count on the hub pages), so a reader sees a way to reach the bench
before scrolling. Text taps count as "text" and mail-in taps as
"mail_in_tips" in assets/quote-tracking.js.

Software-only topics, and the swollen-battery page (a swollen battery should
not be shipped), are skipped. Safe to run repeatedly."""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
MARK = 'bench-top-cta'
BOX = ('<div class="bench-cta bench-utility-cta bench-top-cta"><div>'
       '<strong>Want a second set of eyes?</strong>'
       '<p>Text the model and what happened, and I&rsquo;ll tell you whether it&rsquo;s worth fixing.</p>'
       '<p class="bench-mail-in"><a href="/mail-in-repair" data-quote-kind="mail_in_tips">'
       'Not near Hailey? Mail it in from any state<span aria-hidden="true"> &rarr;</span></a></p>'
       '</div><a class="bench-btn" href="sms:+12084501606">Text 208-450-1606</a></div>')

SKIP = {
    # software, settings or carrier fixes: nothing to mail in
    'airdrop-not-finding-iphone', 'android-photos-not-showing-windows-usb',
    'apple-pencil-not-working', 'apple-watch-not-getting-notifications',
    'bluetooth-headphones-no-sound-windows', 'epson-ecotank-blank-pages',
    'external-drive-not-showing-up-mac', 'fake-support-scam-popups',
    'forgot-new-iphone-passcode', 'ipad-keyboard-not-showing',
    'ipad-screen-wont-rotate', 'iphone-hotspot-not-showing-windows',
    'iphone-not-ringing', 'iphone-sos-no-service',
    'iphone-storage-full-icloud-space', 'macbook-external-monitor-black',
    'one-airpod-not-working', 'printer-offline-after-router-change',
    'ps5-games-usb-extended-storage', 'speed-up-slow-laptop',
    'wifi-keeps-dropping', 'windows-microphone-not-working-calls',
    # a swollen battery must not go in the mail
    'swollen-phone-battery-screen-lifting',
}


def div_end(html, start):
    """Index just past the </div> that closes the <div> opening at start."""
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', html[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return start + m.end()
    return -1


def insert_point(html):
    # 1. Field-guide and article heroes: after the direct-answer box, and
    #    after the one-line scope note that sits under some answers.
    for opener in ('<div class="fg-answer">', '<div class="tip-answer">',
                   '<div class="bench-direct">', '<div class="lbd-direct">'):
        i = html.find(opener)
        if i < 0:
            continue
        end = div_end(html, i)
        scope = re.match(r'\s*<p class="[a-z]{2}-scope">.*?</p>', html[end:], re.S)
        return end + scope.end() if scope else end
    # 2. Symptom-finder hubs: after the guide count.
    i = html.find('<div class="sf-count">')
    if i >= 0:
        return div_end(html, i)
    return -1


added, present, missing = 0, 0, []
for path in sorted((ROOT / 'tips').glob('*.html')):
    if path.stem in SKIP:
        continue
    html = path.read_text()
    main = html.find('<main')
    hero_end = min(x for x in (html.find('</header>', main), html.find('</section>', main)) if x > 0)
    hero = html[main:hero_end]
    if MARK in hero or 'class="bench-mail-in"' in hero:
        present += 1
        continue
    at = insert_point(hero)
    if at < 0:
        missing.append(path.stem)
        continue
    at += main
    path.write_text(html[:at] + BOX + html[at:])
    added += 1

print(f'Tips top text box: added on {added} pages, already on {present}.')
if missing:
    print('No place found on: ' + ', '.join(missing))
