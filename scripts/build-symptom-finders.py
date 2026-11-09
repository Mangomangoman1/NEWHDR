#!/usr/bin/env python3
"""Build the symptom-finder pages and link every guide back to its finder.

A finder is a triage page: it lists what a visitor can see, says in one line
what that usually points to, and sends them to the single guide that covers it.
Every line here must restate what the linked guide already says. Do not add
prices, statistics, or repair claims that are not in the guide.

Run after adding a guide:  python3 scripts/build-symptom-finders.py
Then run bash build.sh and the audits.
"""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://www.haileyrepair.com'
REVIEWED = '2026-11-09'
REVIEWED_LABEL = 'November 9, 2026'
CSS_VERSION = '20261109'
STOP = 'Stop using it'

# slug -> (what you see, what it usually points to, optional flag)
FINDERS = [
    {
        'slug': 'phone-screen-problems',
        'crumb': 'Phone screen problems',
        'kicker': 'Phones · Symptom finder',
        'h1': 'Phone screen problems:<br> find yours by what you see',
        'title': 'Phone screen problems: find yours by what you see',
        'description': 'Black screen, cracks, lines, ghost touch or a lifting display? Match what you see to the right check, and know which symptoms mean stop using the phone.',
        'lede': 'Most screen faults look alike at first: something is dark, cracked, or behaving strangely. Pick the line that matches what you can see. Each one goes to a single guide with safe tests in the right order.',
        'short': 'Phone screens',
        'strip': 'Black, cracked, lines, ghost touch',
        'stop': [
            ('tips/swollen-phone-battery-screen-lifting', 'The screen or back is lifting', 'It may be a swollen battery. Stop charging it.'),
            ('tips/water-damaged-phone', 'The phone got wet', 'Unplug it and power it off before any screen test.'),
            ('tips/backup-iphone-broken-screen', 'The photos are not backed up', 'Check what is already saved before trying fixes.'),
        ],
        'groups': [
            ('dark', 'The screen is dark', [
                ('tips/phone-screen-black-but-on', 'Black screen, but the phone still rings or vibrates', 'Common after a drop. The guide covers the safe first checks, the one restart worth trying, and how to tell a fixable screen from a board fault.', ''),
                ('tips/iphone-stuck-on-apple-logo', 'iPhone stuck on the Apple logo, or restarting in a loop', 'Identify the pattern, use the correct force restart, and try recovery mode without erasing first.', ''),
                ('tips/iphone-restarts-every-three-minutes', 'iPhone restarts about every three minutes', 'It may be logging a repeating panic. Protect the data and avoid erasing before the hardware is diagnosed.', ''),
            ]),
            ('cracked', 'The glass is cracked', [
                ('tips/cracked-screen-safe-to-use', 'Cracked, but touch still works', 'Tell a hairline glass crack from display damage, when a protector helps, and when it is time to repair.', ''),
                ('tips/screen-protector-or-cracked-screen', 'Not sure if it is the screen or only the protector', 'Find the protector’s edge and check the picture without pressing on the crack.', ''),
                ('tips/cracked-iphone-back-glass', 'The back of the iPhone is cracked', 'When a case is a fair stopgap, and the signs to stop: heat, a bent frame, or camera damage.', ''),
            ]),
            ('picture', 'The picture or touch is wrong', [
                ('tips/iphone-green-white-line-screen', 'A green, white or pink line on an iPhone', 'Take a screenshot and view it on another device to tell a display fault from software.', ''),
                ('tips/samsung-screen-issues', 'Samsung green line, flicker, dead touch or burn-in', 'What each AMOLED symptom points to, what to try first, and when it is the screen.', ''),
                ('tips/iphone-ghost-touch-cracked-screen', 'The iPhone taps, types or opens apps by itself', 'Stop the accidental input first, then test the case, protector, charger and moisture.', ''),
                ('tips/swollen-phone-battery-screen-lifting', 'The screen is lifting away from the frame', 'A lifting screen or separating back can mean a swollen lithium battery.', STOP),
            ]),
            ('after', 'After a drop or a repair', [
                ('tips/face-id-not-working-after-drop', 'Face ID stopped working after a drop or screen repair', 'Check obstruction and settings, read the exact message, and inspect Parts and Service History.', ''),
                ('tips/iphone-unknown-part-important-message', 'iPhone shows Unknown Part or an Important Message', 'What Genuine, Used, Finish Repair and Unknown Part mean, and what to ask your repairer.', ''),
                ('tips/lcd-vs-oled', 'Quoted two very different prices for a screen', 'LCD and OLED screens are priced differently. How to tell which your phone has.', ''),
                ('tips/backup-iphone-broken-screen', 'Need the data off an iPhone with a broken screen', 'Check existing iCloud copies, trusted-computer limits, and data-preserving repair options.', ''),
            ]),
        ],
    },
    {
        'slug': 'battery-charging-problems',
        'crumb': 'Battery & charging problems',
        'kicker': 'Power · Symptom finder',
        'h1': 'Battery and charging problems:<br> find the cause',
        'title': 'Battery or charging problem? Find the cause by symptom',
        'description': 'Won’t charge, charges slowly, drains fast, runs hot or looks swollen? Match the symptom to the right check for phones, laptops, watches and controllers.',
        'lede': 'A charging problem can be the cable, the port, a setting, or the battery itself, and buying a battery first is often the wrong move. Start from the symptom, not the part.',
        'short': 'Battery & charging',
        'strip': 'Won’t charge, drains, heat, swelling',
        'stop': [
            ('tips/swollen-phone-battery-screen-lifting', 'Anything is bulging or lifting', 'Stop using and charging it. Read this first.'),
            ('tips/iphone-liquid-detected-port-dry', 'The phone warns about liquid', 'Do not override the warning until you have read this.'),
            ('tips/spilled-liquid-on-laptop', 'Liquid went into a laptop', 'Disconnect power safely. Drying alone is not a repair.'),
        ],
        'groups': [
            ('charging', 'It will not charge, or charges slowly', [
                ('tips/phone-charges-slowly', 'Phone charging slowly, or not at all', 'Test the brick and cable, check the port without poking it, and read the pattern before buying a battery.', ''),
                ('tips/iphone-charging-cable-loose-angle', 'The iPhone cable feels loose, or only works at an angle', 'Tell packed lint from a worn cable, moisture, or a damaged charging port.', ''),
                ('tips/iphone-liquid-detected-port-dry', 'iPhone says Liquid Detected, but the port looks dry', 'Safe drying steps, how to test the cable, and when the port needs service.', ''),
                ('tips/laptop-plugged-in-not-charging', 'Laptop says plugged in, not charging', 'Check the charger’s wattage first, then the port and battery.', ''),
            ]),
            ('drain', 'It drains fast or dies early', [
                ('tips/iphone-battery-health-80-percent', 'iPhone battery health is at 80%', '80% Maximum Capacity means a worn battery, not a dead or unsafe one. When replacing it makes sense.', ''),
                ('tips/cold-weather-phone-battery', 'The phone dies in the cold', 'What is normal in winter, what points to a failing battery, and how to protect the phone.', ''),
                ('tips/laptop-battery-dying', 'Laptop runtime keeps getting shorter', 'How to read runtime loss, system warnings and heat, and when replacement becomes urgent.', ''),
            ]),
            ('heat', 'It is hot or swollen', [
                ('tips/swollen-phone-battery-screen-lifting', 'The phone screen or back is lifting', 'The warning signs of a swollen battery, what to stop doing, and how to store it for now.', STOP),
                ('tips/phone-running-hot', 'The phone runs hot', 'Normal heat from gaming and charging, versus the signs of a battery or water-damage problem.', ''),
                ('tips/laptop-overheating', 'Laptop overheating, or the keyboard is hot', 'Usually dust in the fan or dried thermal paste. What is safe to try and when to stop.', ''),
            ]),
            ('accessories', 'Watches, earbuds and consoles', [
                ('tips/apple-watch-not-charging', 'Apple Watch not charging, or showing a red bolt', 'Check charger contact, allow time for a flat battery, and separate charge limits from faults.', ''),
                ('tips/one-airpod-not-working', 'One AirPod is silent or quieter', 'Check each earbud’s charge, isolate the sound problem, and choose the correct reset.', ''),
                ('tips/ps5-controller-not-charging', 'PS5 controller will not charge', 'Turn on USB power in rest mode, then test one cable and port at a time.', ''),
                ('tips/nintendo-switch-wont-turn-on', 'Nintendo Switch will not turn on or charge', 'Test the console directly with the correct adapter and reset power once.', ''),
            ]),
        ],
    },
    {
        'slug': 'laptop-problems',
        'crumb': 'Laptop problems',
        'kicker': 'Laptops & MacBooks · Symptom finder',
        'h1': 'Laptop problems:<br> find yours by symptom',
        'title': 'Laptop problems: find yours by symptom (Windows & Mac)',
        'description': 'Black screen, won’t charge, overheating, broken hinge, dead keys or no sound? Match your laptop’s symptom to the right checks before paying for a repair.',
        'lede': 'Laptop faults overlap: a black screen can be the display, the cable, or a startup problem. These guides separate them with tests you can do at a desk, and say plainly where to stop.',
        'short': 'Laptops & MacBooks',
        'strip': 'Screen, power, heat, hinge, keys',
        'stop': [
            ('tips/spilled-liquid-on-laptop', 'Something spilled on it', 'Disconnect power safely and avoid automatic restarts.'),
            ('tips/laptop-hinge-breaking', 'The hinge pops or the case is separating', 'Protect the screen cable before it tears.'),
            ('tips/backup-before-repair', 'The files exist only on this laptop', 'Know what to back up before any reset or repair.'),
        ],
        'groups': [
            ('screen', 'Screen and display', [
                ('tips/laptop-screen-black-but-running', 'Screen black, but the fans are running', 'Try brightness, Win+Ctrl+Shift+B and an external monitor to tell a bad screen from a startup problem.', ''),
                ('tips/macbook-pro-stage-light', 'Bright bars along the bottom of a MacBook Pro screen', 'On 2016–2017 models this points to a worn backlight cable. Confirm it with a screenshot and lid test.', ''),
                ('tips/macbook-external-monitor-black', 'External monitor stays black on a MacBook', 'Check input, the video connection, Detect Displays and your model’s limits.', ''),
                ('tips/laptop-hinge-breaking', 'Hinge popping, stiff, or pulling the case apart', 'The mounts inside the housing often broke, not the hinge. Tightening will not fix it.', ''),
            ]),
            ('power', 'Power, battery and liquid', [
                ('tips/laptop-plugged-in-not-charging', 'Plugged in, not charging', 'Check the charger’s wattage first, then the port and battery.', ''),
                ('tips/laptop-battery-dying', 'Battery life keeps shrinking', 'Runtime loss, swelling, heat and system warnings, and when replacement is urgent.', ''),
                ('tips/spilled-liquid-on-laptop', 'Water, coffee or soda spilled on it', 'Disconnect power safely, protect your files, and understand why drying alone is not a repair.', STOP),
            ]),
            ('heat', 'Heat, noise and speed', [
                ('tips/laptop-overheating', 'Overheating, loud fans, or a hot keyboard', 'Usually dust in the fan or dried thermal paste. What is normal heat and what is safe to try.', ''),
                ('tips/speed-up-slow-laptop', 'Slow laptop or Mac', 'Free fixes first, the red flags that point to failing hardware, and when an SSD or RAM upgrade is smarter.', ''),
            ]),
            ('input', 'Keyboard, touchpad, camera and sound', [
                ('tips/laptop-keyboard-keys-not-working', 'Some keys do not work', 'Compare apps, keyboard settings and an external keyboard before replacing keys.', ''),
                ('tips/laptop-touchpad-not-working', 'Touchpad not working', 'Check Windows 11 settings, gestures and official drivers. Stop if the pad is raised or swollen.', ''),
                ('tips/laptop-camera-not-working', 'Webcam black or not detected', 'Check the shutter, Windows 11 permissions, apps and model-specific drivers.', ''),
                ('tips/macbook-speakers-not-working', 'MacBook has no sound', 'Compare apps, check the built-in output, and disconnect audio accessories.', ''),
                ('tips/windows-microphone-not-working-calls', 'Mic works in Windows, but not on calls', 'Match the app input, Windows privacy and site permissions before changing drivers.', ''),
                ('tips/bluetooth-headphones-no-sound-windows', 'Bluetooth headphones connected, but silent', 'Check output, Volume mixer, multipoint and pairing on Windows 11.', ''),
            ]),
            ('storage', 'Drives and Wi-Fi', [
                ('tips/external-drive-not-showing-up-mac', 'External drive not showing up on a Mac', 'Check Finder, connections and mounting safely. Protect files before First Aid or formatting.', ''),
                ('tips/wifi-keeps-dropping', 'Wi-Fi keeps dropping', 'Router, distance and interference, one device versus the whole house, or a failing Wi-Fi card.', ''),
            ]),
        ],
    },
    {
        'slug': 'game-console-problems',
        'crumb': 'Game console problems',
        'kicker': 'PS5 · Xbox · Switch · Symptom finder',
        'h1': 'PS5, Xbox and Switch problems:<br> find yours by symptom',
        'title': 'PS5, Xbox & Switch problems: find yours by symptom',
        'description': 'No signal on the TV, overheating, discs not reading, controller not charging or Joy-Con drift? Match the symptom to safe checks before a reset or repair.',
        'lede': 'Console faults are easy to make worse: a forced HDMI plug or a hasty reset costs more than the original problem. Find the symptom, run the safe checks, and protect your saves first.',
        'short': 'Game consoles',
        'strip': 'No signal, heat, discs, controllers',
        'stop': [
            ('tips/ps5-overheating', 'It shuts off mid-game', 'Read what is normal and what is safe to clean.'),
            ('tips/ps5-no-signal-hdmi', 'The HDMI plug feels loose or bent', 'Do not force it. Spot a damaged port before it gets worse.'),
            ('tips/switch-microsd-card-not-recognized', 'A prompt offers to format', 'Protect screenshots and saves before you accept.'),
        ],
        'groups': [
            ('picture', 'On, but no picture', [
                ('tips/ps5-no-signal-hdmi', 'PS5 has a white light, but the TV says no signal', 'Test the cable and TV input, use Safe Mode once, and spot a damaged HDMI port.', ''),
                ('tips/xbox-series-x-no-signal-hdmi', 'Xbox Series X|S is on, but the TV says no signal', 'Test the cable and input, then boot low-resolution mode.', ''),
                ('tips/switch-no-picture-tv', 'Switch works handheld, but not on the TV', 'Check dock power, HDMI input, resolution and blinking lights.', ''),
            ]),
            ('power', 'Power and heat', [
                ('tips/ps5-overheating', 'PS5 overheating, or the fan is roaring', 'Usually dust packed in the heatsink. What is normal fan noise and what you can clean safely.', ''),
                ('tips/nintendo-switch-wont-turn-on', 'Switch will not turn on or charge', 'Test the console directly with the correct adapter and reset power once.', ''),
            ]),
            ('controllers', 'Controllers', [
                ('tips/ps5-controller-not-charging', 'DualSense will not charge, or shows no light', 'Turn on USB power in rest mode, then test one cable and port at a time.', ''),
                ('tips/switch-joycon-drift', 'Joy-Con drift', 'Why it happens, the quick fixes that sometimes buy time, and when the stick needs replacing.', ''),
            ]),
            ('storage', 'Discs and storage', [
                ('tips/ps5-disc-not-reading', 'PS5 will not read discs', 'Check the disc type and side, compare a second disc, and set up a detachable drive before any reset.', ''),
                ('tips/ps5-games-usb-extended-storage', 'PS5 game on a USB drive will not play', 'PS5 games cannot run from USB extended storage. Copy it back without formatting.', ''),
                ('tips/switch-microsd-card-not-recognized', 'Switch does not recognize the microSD card', 'Check SDXC or Express compatibility and reseat with power off.', ''),
            ]),
        ],
    },
]

PERSON = {
    '@type': 'Person', '@id': f'{ORIGIN}/about#samuel', 'name': 'Samuel Torres',
    'url': f'{ORIGIN}/about', 'jobTitle': 'Owner and repair technician',
    'worksFor': {'@id': f'{ORIGIN}/#business'},
}
ARROW = '<i class="sf-arrow" aria-hidden="true"></i>'


def template_parts():
    """Borrow the shared navigation and footer from an existing field guide."""
    source = (ROOT / 'tips/iphone-not-ringing.html').read_text()
    nav = source[source.index('<!-- shared-navigation:start -->'):source.index('<!-- shared-navigation:end -->') + len('<!-- shared-navigation:end -->')]
    tail = source[source.index('<footer class="fg-footer">'):]
    return nav, tail


def page_title(path):
    text = (ROOT / f'{path}.html').read_text()
    return re.search(r'<title>(.*?)</title>', text).group(1)


def build(finder, nav, tail):
    url = f"{ORIGIN}/tips/{finder['slug']}"
    title, description = escape(finder['title']), escape(finder['description'])
    guides = []
    for _, _, rows in finder['groups']:
        for row in rows:
            if row[0] not in guides: guides.append(row[0])
    schema = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', '@id': f'{url}#page', 'url': url, 'name': finder['title'],
         'description': finder['description'], 'dateModified': REVIEWED, 'author': PERSON,
         'publisher': {'@id': f'{ORIGIN}/#business'}, 'isPartOf': {'@id': f'{ORIGIN}/tips#page'},
         'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(guides), 'itemListElement': [
             {'@type': 'ListItem', 'position': i, 'url': f'{ORIGIN}/{g}', 'name': re.sub(r'&amp;', '&', page_title(g))}
             for i, g in enumerate(guides, 1)]}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{ORIGIN}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Repair Library', 'item': f'{ORIGIN}/tips'},
            {'@type': 'ListItem', 'position': 3, 'name': finder['crumb'], 'item': url}]},
    ]}
    stop = ''.join(
        f'<a href="/{href}"><strong>{escape(see)}</strong><span>{escape(why)}</span>{ARROW}</a>'
        for href, see, why in finder['stop'])
    toc, body, number = '', '', 0
    for index, (anchor, heading, rows) in enumerate(finder['groups'], 1):
        toc += f'<a href="#{anchor}"><span>{index:02d}</span>{escape(heading)}</a>'
        items = ''
        for href, see, means, flag in rows:
            number += 1
            badge = f'<span class="sf-row__flag">{escape(flag)}</span><br>' if flag else ''
            items += (f'<li><a class="sf-row" href="/{href}"><span class="sf-row__n">{number:02d}</span>'
                      f'<span>{badge}<strong class="sf-row__see">{escape(see)}</strong>'
                      f'<span class="sf-row__means">{escape(means)}</span></span>'
                      f'<span class="sf-row__go">{ARROW}</span></a></li>')
        count = f'{len(rows)} guide' + ('s' if len(rows) != 1 else '')
        body += (f'<section class="sf-group" id="{anchor}"><header><div><span class="fg-number">{index:02d} / What you see</span>'
                 f'<h2>{escape(heading)}</h2></div><p>{count}</p></header><ol class="sf-rows">{items}</ol></section>\n')
    others = ''.join(
        f'<a href="/tips/{other["slug"]}">{escape(other["crumb"])} {ARROW}</a>'
        for other in FINDERS if other is not finder)
    return f'''<!DOCTYPE html>
<html lang="en" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="ai-access" content="allow"><meta name="ai-training" content="allow"><meta name="ai-content-type" content="page">
<title>{title}</title><meta name="description" content="{description}"><meta name="theme-color" content="#0b0f14">
<link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{url}"><meta property="og:image" content="{ORIGIN}/og-image.svg"><meta property="og:image:alt" content="Hailey Device Repair"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{description}"><meta name="twitter:image" content="{ORIGIN}/og-image.svg">
<link rel="icon" href="/favicon.ico"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@700;800;900&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/material-symbols.css"><link rel="stylesheet" href="/assets/css/bench-tips.css?v=quiet-20260708"><link rel="stylesheet" href="/assets/css/repair-tip-pages.css?v=20260902"><link rel="stylesheet" href="/assets/css/site-navigation.css?v=20260911"><link rel="stylesheet" href="/nav-quote.css?v=20260709"><link rel="stylesheet" href="/assets/css/quick-find.css?v=20260906"><link rel="stylesheet" href="/assets/css/site-polish.css?v=20260906"><link rel="stylesheet" href="/assets/css/site-design.css?v=20260906"><link rel="stylesheet" href="/assets/css/repair-field-guides.css?v=20260911"><link rel="stylesheet" href="/assets/css/symptom-finder.css?v={CSS_VERSION}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, separators=(',', ':'))}</script>
</head>
<body class="bench-tips-page fg-page sf-page"><a class="fg-skip" href="#content">Skip to symptoms</a>
{nav}
<main id="content" tabindex="-1">
<header class="fg-hero"><div class="fg-wrap">
<nav class="fg-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/tips">Repair Library</a><span>/</span><span>{escape(finder['crumb'])}</span></nav>
<div class="fg-hero-grid"><div class="fg-heading"><p class="fg-kicker">{escape(finder['kicker'])}</p><h1>{finder['h1']}</h1><p class="fg-byline">By <a href="/about" rel="author">Samuel</a>, owner &amp; technician <span>·</span> <time datetime="{REVIEWED}">{REVIEWED_LABEL}</time></p>
<p class="sf-lede">{escape(finder['lede'])}</p>
<div class="sf-count"><div><strong>{len(guides)}</strong>guides</div><div><strong>{len(finder['groups'])}</strong>symptom groups</div></div></div>
<aside class="sf-stop" aria-labelledby="stop-title"><p>Before any test</p><h2 id="stop-title">Three things change the first step.</h2>{stop}</aside>
</div></div></header>
<div class="fg-wrap fg-layout"><aside class="fg-aside"><nav aria-label="Symptom groups"><p class="fg-kicker">Jump to</p>{toc}<a href="#next"><span>→</span>Not on this list?</a></nav><a class="fg-back" href="/tips">← All repair guides</a></aside>
<article class="fg-article">
{body}<section class="sf-end" id="next"><div><h2>Not on this list?</h2><p>Device Check asks a few questions about your device and what happened, then gives an estimate and a next step.</p><a class="sf-btn" href="/device-check">Open Device Check {ARROW}</a></div><div><h2>Rather ask a person?</h2><p>Send the model, what happened, and what you have tried. You get a straight answer and a quote before any work.</p><a class="sf-btn" href="/contact">Text Samuel {ARROW}</a></div></section>
<section class="sf-others"><p class="fg-kicker">Other symptom finders</p><div>{others}<a href="/tips">The whole Repair Library {ARROW}</a></div>
<p class="sf-method">Each line above restates what its guide covers. The guides hold the tests, the limits, and the sources.</p></section>
</article></div></main>{tail}'''


def strip_for(route, finder):
    if finder:
        first = (f'<a href="/tips/{finder["slug"]}"><div><small>Related symptoms</small><strong>{escape(finder["crumb"])}</strong>'
                 f'<span>{escape(finder["strip"])}</span></div>{ARROW}</a>')
    else:
        first = (f'<a href="/tips"><div><small>All guides</small><strong>The Repair Library</strong>'
                 f'<span>Every guide, by device</span></div>{ARROW}</a>')
    second = (f'<a href="/device-check"><div><small>Not sure what is wrong?</small><strong>Device Check</strong>'
              f'<span>A few questions, then an estimate</span></div>{ARROW}</a>')
    return f'<!-- symptom-finder-strip:start --><nav class="sf-strip" aria-label="Find another symptom">{first}{second}</nav><!-- symptom-finder-strip:end -->'


def hub_section():
    cards = ''
    for finder in FINDERS:
        total = len({row[0] for _, _, rows in finder['groups'] for row in rows})
        cards += (f'<a class="sf-hub__card" href="/tips/{finder["slug"]}"><span class="sf-hub__n">{total}<small>guides</small></span>'
                  f'<strong>{escape(finder["short"])}</strong><span>{escape(finder["strip"])}</span>{ARROW}</a>')
    return ('<!-- symptom-finders:start --><section class="sf-hub" aria-labelledby="finder-title"><div class="rh-shell">'
            '<header class="rh-section-head rh-reveal"><h2 id="finder-title">Find it by symptom.</h2>'
            '<p>Not sure which guide you need? Start from what you can see. Each finder sorts look-alike problems and points to one guide.</p></header>'
            f'<div class="sf-hub__grid rh-reveal">{cards}</div></div></section><!-- symptom-finders:end -->\n\n')


def about_section():
    links = ''.join(f'<a href="/tips/{finder["slug"]}">{escape(finder["crumb"])} {ARROW}</a>' for finder in FINDERS)
    return ('<!-- symptom-finders:start --><section class="section sf-about" id="guides"><div class="container"><div class="sf-about__grid">'
            '<div><div class="section-eyebrow">The Repair Library</div><h2 class="section-title" style="text-align:left">Guides from the same bench</h2>'
            '<p>Samuel writes and reviews the troubleshooting guides in the Repair Library. They are free to use whether or not you ever need a repair, and each one says plainly when to stop and get help.</p></div>'
            f'<nav class="sf-others" aria-label="Symptom finders"><div>{links}<a href="/tips">The whole Repair Library {ARROW}</a></div></nav>'
            '</div></div></section><!-- symptom-finders:end -->\n')


def inject(path, before, block, stylesheet):
    html = (ROOT / path).read_text()
    html = re.sub(r'<!-- symptom-finders:start -->[\s\S]*?<!-- symptom-finders:end -->\n*', '', html)
    html = re.sub(r'<link[^>]+symptom-finder\.css[^>]*>\n?', '', html)
    assert html.count(before) == 1, f'{path}: anchor not found'
    html = html.replace(before, block + before, 1).replace('</head>', stylesheet + '\n</head>', 1)
    (ROOT / path).write_text(html)


def main():
    nav, tail = template_parts()
    membership = {}
    for finder in FINDERS:
        (ROOT / f"tips/{finder['slug']}.html").write_text(build(finder, nav, tail))
        for _, _, rows in finder['groups']:
            for row in rows: membership.setdefault(row[0], finder)
    for finder in FINDERS:
        for href, _, _ in finder['stop']: membership.setdefault(href, finder)
    finder_files = {f"tips/{finder['slug']}" for finder in FINDERS}
    stylesheet = f'<link rel="stylesheet" href="/assets/css/symptom-finder.css?v={CSS_VERSION}">'
    updated = 0
    for path in sorted((ROOT / 'tips').glob('*.html')):
        route = f'tips/{path.stem}'
        if route in finder_files: continue
        html = path.read_text()
        html = re.sub(r'\n?<!-- symptom-finder-strip:start -->[\s\S]*?<!-- symptom-finder-strip:end -->\n?', '', html)
        html = re.sub(r'<link[^>]+symptom-finder\.css[^>]*>\n?', '', html)
        html = html.replace('</main>', '\n' + strip_for(route, membership.get(route)) + '\n</main>', 1)
        html = html.replace('</head>', stylesheet + '\n</head>', 1)
        path.write_text(html)
        updated += 1
    inject('tips.html', '<section class="rh-library" id="library">', hub_section(), stylesheet)
    inject('about.html', '<section class="section section--alt" id="values">', about_section(), stylesheet)
    print(f'Symptom finders: {len(FINDERS)} pages built, {updated} guides linked.')


if __name__ == '__main__':
    main()
