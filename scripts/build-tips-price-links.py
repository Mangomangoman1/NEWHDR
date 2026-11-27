#!/usr/bin/env python3
"""Put a short "what the fix costs" strip on hardware tips pages.

Each strip links the guide to the model price pages in /repair (or the matching
section of /pricing) and to mail-in. Every price comes from pricing-data.json
through scripts/build-repair-prices.py, so the strip can never drift from the
price list. Software-only guides get no strip.

Safe to run again: the block between the PRICE-LINK markers is rebuilt each time.
Runs from build.sh, so new tips pages pick it up once they are in TIPS below.
"""
from html import escape
from pathlib import Path
import importlib.util
import re

ROOT = Path(__file__).resolve().parent.parent
CSS_TAG = '<link rel="stylesheet" href="/assets/css/price-bridge.css?v=20261127">'
START, END = '<!-- PRICE-LINK:START -->', '<!-- PRICE-LINK:END -->'

spec = importlib.util.spec_from_file_location('brp', ROOT / 'scripts' / 'build-repair-prices.py')
brp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(brp)
MODEL = {m['slug']: m for m in brp.MODELS}
DATA = brp.DATA
money = brp.money

IPHONES = ['iphone-16', 'iphone-15', 'iphone-13']
JOB_WORDS = {
    'Screen': 'screen replacement', 'Battery': 'battery replacement', 'Charge Port': 'charging port repair',
    'Back Glass': 'back glass replacement', 'HDMI Port': 'HDMI port repair', 'Disc Drive': 'disc drive repair',
    'Stick Drift Fix': 'stick drift fix', 'USB-C Port / Battery': 'charging port or battery',
    'Liquid Metal Repaste': 'liquid metal repaste', 'Thermal Repaste + Deep Clean': 'repaste and deep clean',
    'USB-C Charge Port': 'charging port repair', 'Game Card Reader': 'game card reader',
    'Glass / Digitizer': 'glass and touch', 'Screen (LCD)': 'LCD screen', 'Screen (OLED)': 'OLED screen',
    'Front USB-C Port': 'front USB-C port', 'Power Supply': 'power supply', 'Power Supply / Power Issue': 'power supply',
    'Fan Replacement': 'fan replacement', 'LCD (under glass)': 'LCD', 'Screen Assembly': 'screen assembly', 'Display': 'display replacement',
}


def iphone(jobs=None, title=None):
    return {'family': 'iphone', 'models': IPHONES, 'jobs': jobs, 'title': title,
            'all': ('/repair#g-iphone', 'Every iPhone model')}


def console(models, jobs=None, title=None):
    return {'family': 'console', 'models': models, 'jobs': jobs, 'title': title,
            'all': ('/repair#g-console', 'Every console and controller')}


def cats(rows, title, all_link):
    # rows: (label, cat, jobs or None, href)
    return {'family': 'cats', 'rows': rows, 'title': title, 'all': all_link}


DROID_ALL = ('/repair#g-samsung', 'Every Galaxy and Pixel model')
IPAD_ALL = ('/repair#g-ipad', 'Every iPad model')
MAC_ALL = ('/repair#g-macbook', 'Every MacBook model')
MACS3 = ['macbook-air-13-inch-m1-2020', 'macbook-air-13-inch-m2-2022', 'macbook-pro-14-inch-m1-pro-max-2021']


def M(slug, jobs=None):
    """A row for one model page in /repair."""
    return (None, 'model:' + slug, jobs, None)

TIPS = {
    # iPhone screen
    **{s: iphone(['Screen']) for s in (
        'iphone-ghost-touch-cracked-screen', 'iphone-green-white-line-screen', 'black-spot-on-phone-screen',
        'white-spot-on-phone-screen', 'phone-screen-black-but-on', 'phone-touch-screen-not-working-after-drop',
        'cracked-screen-safe-to-use', 'screen-protector-or-cracked-screen', 'lcd-vs-oled',
        'backup-iphone-broken-screen', 'phone-screen-black-after-water', 'phone-screen-problems')},
    # iPhone battery
    **{s: iphone(['Battery']) for s in (
        'iphone-battery-health-80-percent', 'iphone-restarts-every-three-minutes',
        'swollen-phone-battery-screen-lifting', 'cold-weather-phone-battery', 'battery-charging-problems')},
    # iPhone charging port
    **{s: iphone(['Charge Port']) for s in (
        'iphone-charging-cable-loose-angle', 'iphone-liquid-detected-port-dry', 'phone-charges-slowly')},
    'phone-not-charging-port-or-battery': cats(
        [M('iphone-16', ['Battery']), M('iphone-16', ['Charge Port']),
         M('samsung-galaxy-s24', ['Battery']), M('samsung-galaxy-s24', ['Charge Port'])],
        'Battery or port: what each costs', ('/repair', 'Every phone model')),
    'cracked-iphone-back-glass': iphone(['Back Glass']),
    # iPhone, other hardware: link the model pages without quoting a job that is not on the list
    **{s: iphone() for s in (
        'iphone-not-ringing', 'iphone-microphone-not-working', 'iphone-speaker-muffled-after-water',
        'iphone-flashlight-not-working', 'iphone-camera-shaking-clicking-not-focusing', 'cracked-iphone-camera-lens',
        'face-id-not-working-after-drop', 'iphone-sos-no-service', 'iphone-stuck-on-apple-logo',
        'iphone-unknown-part-important-message', 'phone-buttons-not-working-after-drop',
        'phone-speaker-not-working-after-drop', 'phone-wont-turn-on-after-drop', 'water-damaged-phone',
        'phone-running-hot', 'bent-phone-or-ipad')},
    # Consoles
    'ps5-no-signal-hdmi': console(['ps5'], ['HDMI Port']),
    'ps5-disc-not-reading': console(['ps5'], ['Disc Drive']),
    'ps5-overheating': console(['ps5'], ['Liquid Metal Repaste', 'Thermal Repaste + Deep Clean'],
                               'What a PS5 cooling repair costs'),
    'ps5-controller-stick-drift': console(['ps5-controller'], ['Stick Drift Fix']),
    'ps5-controller-not-charging': console(['ps5-controller'], ['USB-C Port / Battery'],
                                           'What a PS5 controller charging repair costs'),
    'ps5-controller-not-connecting': console(['ps5-controller']),
    'switch-joycon-drift': console(['joy-con', 'ps5-controller', 'xbox-controller'], ['Stick Drift Fix'],
                                   'What a stick drift fix costs'),
    'nintendo-switch-wont-turn-on': console(['nintendo-switch'], ['USB-C Charge Port', 'Battery']),
    'switch-no-picture-tv': console(['nintendo-switch']),
    'switch-microsd-card-not-recognized': console(['nintendo-switch']),
    'xbox-series-x-no-signal-hdmi': console(['xbox-series-x', 'xbox-one'], ['HDMI Port'],
                                            'What an Xbox HDMI port repair costs'),
    'game-console-problems': console(['ps5', 'xbox-series-x', 'nintendo-switch'],
                                     title='Console repair prices, by system'),
    # Samsung and Pixel
    'samsung-screen-issues': cats([M('samsung-galaxy-s24', ['Screen']), M('samsung-galaxy-s23', ['Screen']), M('google-pixel-8', ['Screen'])],
                                  'What an Android screen replacement costs', DROID_ALL),
    'samsung-moisture-detected': cats([M('samsung-galaxy-s24', ['Charge Port']), M('samsung-galaxy-a14-a15-a16', ['Charge Port']),
                                       M('google-pixel-8', ['Charge Port'])],
                                      'What an Android charging port repair costs', DROID_ALL),
    **{s: cats([M('samsung-galaxy-s24'), M('samsung-galaxy-s23'), M('samsung-galaxy-a14-a15-a16')],
               'Samsung Galaxy repair prices, by model', DROID_ALL) for s in ('samsung-camera-failed', 'cracked-samsung-back-glass')},
    # iPad
    'cracked-ipad-screen': cats([M('ipad-10', ['Glass / Digitizer']), M('ipad-7-8-9', ['Glass / Digitizer']), M('ipad-air-4-5', ['Screen Assembly'])],
                                'What an iPad screen repair costs', IPAD_ALL),
    'apple-pencil-not-working': cats([M('ipad-10'), M('ipad-air-11-m2-m3-m4'), M('ipad-mini-6')], 'iPad repair prices, by model', IPAD_ALL),
    # MacBook and laptops
    'laptop-battery-dying': cats([M(m, ['Battery']) for m in MACS3], 'What a MacBook battery replacement costs', MAC_ALL),
    **{s: cats([M(m, ['Display']) for m in MACS3], 'What a MacBook display replacement costs', MAC_ALL) for s in (
        'laptop-screen-black-but-running', 'laptop-screen-damaged-after-drop', 'macbook-pro-stage-light')},
    **{s: cats([M(m) for m in MACS3], 'MacBook repair prices, by model', MAC_ALL) for s in (
        'macbook-speakers-not-working', 'macbook-external-monitor-black')},
    **{s: cats([M(MACS3[0]), M(MACS3[2]), ('Windows laptops and Chromebooks', None, None, '/laptop-repair')],
               'Laptop repair prices', MAC_ALL) for s in (
        'laptop-hinge-breaking', 'laptop-keyboard-keys-not-working', 'laptop-camera-not-working',
        'laptop-touchpad-not-working', 'laptop-overheating', 'laptop-plugged-in-not-charging',
        'spilled-liquid-on-laptop', 'laptop-problems', 'acer-chromebook-black-screen')},
}


SEE = '<span class="pb-price pb-price--list"><b>See prices</b></span>'


def price_span(rows):
    mail = min(money(r['mailin']) for r in rows)
    walk = min(money(r['price']) for r in rows)
    lead = 'from ' if len({r['mailin'] for r in rows}) > 1 else ''
    return (f'<span class="pb-price"><b>{lead}${mail}</b>'
            f'<small>by mail · ${walk} in Hailey</small></span>')


def cap(text):
    return text[:1].upper() + text[1:]


def job_list(jobs):
    words = [JOB_WORDS.get(j, j.lower()).split(' replacement')[0].split(' repair')[0] for j in jobs]
    words = list(dict.fromkeys(words))
    return cap(', '.join(words[:4]) + (' and more' if len(words) > 4 else ''))


def job_label(jobs):
    return ' or '.join(JOB_WORDS.get(j, j.lower()) for j in jobs)


def row(href, name, sub, price_html):
    return (f'<li><a href="{href}"><span class="pb-model"><strong>{escape(name)}</strong>'
            f'<small>{escape(sub)}</small></span>{price_html}'
            f'<i class="pb-arrow" aria-hidden="true"></i></a></li>')


def model_rows(cfg):
    out = []
    for slug in cfg['models']:
        model = MODEL[slug]
        rows = brp.rows_for(model)
        if cfg['jobs']:
            picked = [r for r in rows if r['job'] in cfg['jobs']]
            assert picked, f'{slug} has no {cfg["jobs"]} price'
            sub = cap(job_label(sorted({r['job'] for r in picked}, key=cfg['jobs'].index)))
            out.append(row(f'/repair/{slug}', model['name'], sub, price_span(picked)))
        else:
            out.append(row(f'/repair/{slug}', model['name'], job_list(r['job'] for r in rows), SEE))
    return out


def cat_rows(cfg):
    out = []
    for label, cat, jobs, href in cfg['rows']:
        if cat is None:
            out.append(row(href, label, 'Every model is different',
                           '<span class="pb-price pb-price--list"><b>Quoted by text</b></span>'))
            continue
        if cat.startswith('model:'):
            slug = cat[6:]
            model = MODEL[slug]
            label, href = model['name'], f'/repair/{slug}'
            rows = [r for r in brp.rows_for(model) if not jobs or r['job'] in jobs]
            if jobs:
                jobs = [j for j in jobs if any(r['job'] == j for r in rows)]
        else:
            rows = [r for r in DATA if r['cat'] == cat and (not jobs or r['job'] in jobs)]
        assert rows, f'no {cat} {jobs} prices'
        if jobs:
            out.append(row(href, label, cap(job_label(jobs)), price_span(rows)))
        else:
            out.append(row(href, label, job_list(r['job'] for r in rows), SEE))
    return out


def title_for(cfg):
    if cfg.get('title'):
        return cfg['title']
    if cfg['family'] == 'iphone':
        return f'What an iPhone {job_label(cfg["jobs"])} costs' if cfg['jobs'] else 'iPhone repair prices, by model'
    names = [MODEL[s]['name'] for s in cfg['models']]
    if cfg['jobs'] and len(names) == 1:
        return f'What a {names[0]} {job_label(cfg["jobs"][:1])} costs'
    return f'{names[0]} repair prices'


TRUCK = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
         'stroke-linejoin="round" focusable="false"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/>'
         '<path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/><path d="m7.8 5.3 8.4 4.5"/></svg>')

MAIL_GUIDES = {'#g-iphone': '/mail-in/iphone', '#g-samsung': '/mail-in/android', '#g-pixel': '/mail-in/android',
               '#g-ipad': '/mail-in/ipad', '#g-macbook': '/mail-in/macbook', '#g-console': '/mail-in/console'}


def mail_guide(cfg, accent):
    """The mail-in guide for the panel's device family; the mail-in hub when the panel spans families."""
    if accent == 'console':
        return '/mail-in/console'
    href = cfg['all'][0]
    return next((guide for frag, guide in MAIL_GUIDES.items() if href.endswith(frag)), '/mail-in-repair')


def block(cfg):
    accent = 'console' if cfg['family'] == 'console' else 'phone'
    rows = cat_rows(cfg) if cfg['family'] == 'cats' else model_rows(cfg)
    all_href, all_label = cfg['all']
    return (
        f'{START}<section class="pb-bridge pb-bridge--{accent}" aria-labelledby="pb-title">'
        f'<div class="pb-head"><p class="pb-kicker">Repair prices</p>'
        f'<h2 id="pb-title">{escape(title_for(cfg))}</h2>'
        f'<p class="pb-note">Straight from our price list. Mail-in prices include return shipping.</p>'
        f'<a class="pb-all" href="{all_href}">{escape(all_label)} <i class="pb-arrow" aria-hidden="true"></i></a></div>'
        f'<ul class="pb-rows">{"".join(rows)}</ul>'
        f'<a class="pb-mail" href="{mail_guide(cfg, accent)}"><span class="pb-mail__icon" aria-hidden="true">{TRUCK}</span>'
        f'<span class="pb-mail__copy"><strong>Not local? Mail it in from any state.</strong>'
        f'<small>Ships from anywhere in the lower 48. Free quote by text before you ship, and most repairs are done '
        f'within 1–2 days of arriving.</small></span>'
        f'<span class="pb-mail__btn">Start a mail-in <i class="pb-arrow" aria-hidden="true"></i></span></a>'
        f'</section>{END}'
    )


def main():
    done = 0
    for slug, cfg in TIPS.items():
        page = ROOT / 'tips' / f'{slug}.html'
        if not page.exists():
            print(f'  price links: skipped {slug} (no page)')
            continue
        html = page.read_text()
        html = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '', html, flags=re.S)
        new = block(cfg)
        anchor = '<!-- symptom-finder-strip:start -->'
        if anchor in html:
            html = html.replace(anchor, new + '\n' + anchor, 1)
        else:
            html = html.replace('</main>', new + '\n</main>', 1)
        if 'assets/css/price-bridge.css' in html:
            html = re.sub(r'<link rel="stylesheet" href="/assets/css/price-bridge\.css[^"]*">', CSS_TAG, html)
        else:
            html = html.replace('</head>', CSS_TAG + '\n</head>', 1)
        page.write_text(html)
        done += 1
    print(f'Price links on {done} tips pages.')


if __name__ == '__main__':
    main()
