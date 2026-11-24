#!/usr/bin/env python3
"""Build the per-model repair price pages (/repair/<model>) and their index (/repair).

Every price on these pages comes from assets/pricing-data.json, the same file
that builds /pricing, so a price can never differ between the two. Do not type
prices, turnaround promises or shipping terms into this script: change the data
file, or the published mail-in page, and rebuild.

Run after changing prices or adding a model:  python3 scripts/build-repair-prices.py
Then add any new route to sitemap.xml, run bash build.sh and the audits.
"""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://www.haileyrepair.com'
CHECKED = '2026-11-24'
CHECKED_LABEL = 'November 24, 2026'
CSS_VERSION = '20261124b'
SMS = 'sms:+12084501606'
TEL = 'tel:+12084501606'
PHONE = '208-450-1606'
PERSON = {
    '@type': 'Person', '@id': f'{ORIGIN}/about#samuel', 'name': 'Samuel Torres',
    'url': f'{ORIGIN}/about', 'jobTitle': 'Owner and repair technician',
    'worksFor': {'@id': f'{ORIGIN}/#business'},
}
ARROW = '<i class="rp-arrow" aria-hidden="true"></i>'

DATA = json.loads((ROOT / 'assets/pricing-data.json').read_text())


def slugify(name):
    s = name.lower().replace('(', '').replace(')', '').replace('+', ' plus')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def money(text):
    return int(re.sub(r'[^0-9]', '', text))


# ─── What each job is, in plain words. Only facts about the part itself. ───
IPHONE_JOBS = {
    'Screen': ('Screen replacement', 'The whole display assembly: glass, touch and picture are one part on iPhone, so a cracked screen and a black screen are the same job.', 'tips/cracked-screen-safe-to-use', 'Is a cracked screen safe to keep using?'),
    'Battery': ('Battery replacement', 'A new cell for a phone that dies early, shuts off in the cold, or shows a low maximum capacity.', 'tips/iphone-battery-health-80-percent', 'Is 80% battery health time to replace?'),
    'Charge Port': ('Charging port repair', 'The port assembly at the bottom of the phone, for a cable that only works at an angle or a phone that will not charge.', 'tips/iphone-charging-cable-loose-angle', 'Cable loose or works only at an angle'),
    'Back Glass': ('Back glass replacement', 'The rear glass panel, replaced on its own while your original frame stays.', 'tips/cracked-iphone-back-glass', 'Cracked back glass: what to check first'),
}
GRADES = {
    'Incell LCD': 'An aftermarket LCD panel, the lowest-cost screen.',
    'Hard OLED': 'An aftermarket OLED panel on a rigid backing, with the deep blacks of an OLED.',
    'Soft OLED': 'An aftermarket OLED on a flexible backing, built the way the original panel is.',
    'Soft OLED 120Hz': 'An aftermarket flexible OLED that keeps the 120Hz refresh rate.',
    'Aftermarket cell (health msg on 11+)': 'A new aftermarket cell. On iPhone 11 and later, Settings shows a message that the battery is not a genuine Apple part.',
    'Aftermarket flex': 'An aftermarket port assembly.',
    'Glass only (no housing swap)': 'New rear glass; your original frame and parts stay.',
}
# Jobs for the other families: (title, what it is, tip, tip label). Only facts about the part.
JOBS = {
    'android': {
        'Screen': ('Screen replacement', 'The display and touch layer, replaced together as one assembly.', 'tips/samsung-screen-issues', 'Green line, flicker or dead touch'),
        'Battery': ('Battery replacement', 'A new cell for a phone that dies early, drains fast or has started to swell.', 'tips/swollen-phone-battery-screen-lifting', 'Screen or back lifting? Read this first'),
        'Charge Port': ('Charging port repair', 'The USB-C port and the small board or cable it sits on.', 'tips/samsung-moisture-detected', 'Moisture detected on the port'),
    },
    'ipad': {
        'Screen Assembly': ('Screen replacement', 'On this iPad the glass, touch and picture are bonded into one part, so they are replaced together.', 'tips/cracked-ipad-screen', 'Cracked iPad screen: two tests first'),
        'Glass / Digitizer': ('Glass and touch replacement', 'The front glass and the touch layer bonded to it. The picture sits on a separate panel underneath.', 'tips/cracked-ipad-screen', 'Cracked iPad screen: two tests first'),
        'LCD (under glass)': ('LCD replacement', 'The picture panel under the glass, for lines, dark patches or no picture when the glass is fine.', 'tips/cracked-ipad-screen', 'Is it the glass or the display?'),
        'Battery': ('Battery replacement', 'A new cell for an iPad that drains fast or shuts off early.', 'tips/swollen-phone-battery-screen-lifting', 'Screen lifting? Stop charging it'),
        'Charge Port': ('Charging port repair', 'The port is soldered to the board on iPad, so this is a micro-soldering job.', 'tips/battery-charging-problems', 'Not charging: what to check first'),
    },
    'macbook': {
        'Display': ('Display replacement', 'The complete display assembly, replaced as one part.', 'tips/laptop-screen-damaged-after-drop', 'Screen damaged after a drop'),
        'Battery': ('Battery replacement', 'A new battery for a MacBook that drains fast or shows Service Recommended.', 'tips/laptop-battery-dying', 'Battery dying fast: what to check'),
    },
}
GRADES.update({
    'OEM service pack w/ frame': 'A Samsung service pack: a genuine Samsung screen that comes fitted to a new frame.',
    'OEM service pack': 'A Samsung service pack, a genuine Samsung screen.',
    'Aftermarket / incell': 'An aftermarket in-cell screen.',
    'OEM/premium cell': 'A genuine or premium aftermarket battery cell.',
    'Premium cell': 'A premium aftermarket battery cell.',
    'Sub-board or flex': 'The charging sub-board or port cable, replaced as a unit.',
    'Sub-board': 'The charging sub-board, replaced as a unit.',
    'Sub-board / flex': 'The charging sub-board or port cable, replaced as a unit.',
    'OEM / premium AM': 'A genuine Google screen or a premium aftermarket one.',
    'Aftermarket digitizer': 'An aftermarket glass and touch panel.',
    'Aftermarket LCD': 'An aftermarket LCD panel.',
    'Aftermarket cell': 'A new aftermarket battery cell.',
    'Soldered — micro-solder': 'Soldered to the board and replaced with micro-soldering.',
    'Laminated assembly': 'Glass, touch and display bonded as one part.',
    'OLED assembly': 'Glass, touch and OLED display bonded as one part.',
    'Aftermarket / OEM-pull': 'An aftermarket battery, or a genuine Apple one pulled from another iPad.',
    'Full assembly, OEM-pull/AM': 'The complete display assembly: a genuine Apple part pulled from another MacBook, or an aftermarket one.',
    'Full assembly': 'The complete display assembly.',
    'Aftermarket': 'An aftermarket battery.',
    'Aftermarket / OEM': 'An aftermarket or genuine Apple battery.',
    'OEM': 'A genuine Apple battery.',
    'OEM-pull/AM': 'A genuine Apple battery pulled from another MacBook, or an aftermarket one.',
})
JOB_FAMILY = {'samsung': 'android', 'pixel': 'android', 'ipad': 'ipad', 'macbook': 'macbook'}
LCD_NATIVE = {'iPhone 8', 'iPhone 8 Plus', 'iPhone XR', 'iPhone 11', 'iPhone SE (2020)', 'iPhone SE (2022)'}

CONSOLE_TIPS = {
    'HDMI Port': ('tips/ps5-no-signal-hdmi', 'No signal on the TV? Test this first'),
    'Disc Drive': ('tips/ps5-disc-not-reading', 'Disc not reading: what to try'),
    'Liquid Metal Repaste': ('tips/ps5-overheating', 'Running hot or loud: what it means'),
    'Thermal Repaste + Deep Clean': ('tips/ps5-overheating', 'Running hot or loud: what it means'),
    'Stick Drift Fix': ('tips/ps5-controller-stick-drift', 'Stick drift: what causes it'),
    'USB-C Port / Battery': ('tips/ps5-controller-not-charging', 'Controller not charging'),
}

FAMILIES = {
    'iphone': {'label': 'iPhone', 'accent': 'iphone', 'service': ('iphone-repair', 'iPhone repair'), 'mailin': ('mail-in/iphone', 'Mail-in iPhone repair'),
               'related': [('tips/phone-screen-black-but-on', 'Screen black but the phone still rings'), ('tips/backup-iphone-broken-screen', 'Back up an iPhone with a broken screen'),
                           ('tips/water-damaged-phone', 'The phone got wet'), ('tips/iphone-unknown-part-important-message', 'The “unknown part” message after a repair')]},
    'console': {'label': 'Consoles', 'accent': 'console', 'service': ('console-repair', 'Game console repair'), 'mailin': ('mail-in-repair', 'Mail-in repair'),
                'related': [('tips/game-console-problems', 'Console problems, by symptom'), ('tips/ps5-no-signal-hdmi', 'PS5 no signal over HDMI'),
                            ('tips/xbox-series-x-no-signal-hdmi', 'Xbox Series X|S no signal'), ('tips/nintendo-switch-wont-turn-on', 'Switch won’t turn on')]},
    'samsung': {'label': 'Samsung Galaxy', 'accent': 'android', 'service': ('android-repair', 'Samsung and Android repair'), 'mailin': ('mail-in-repair', 'Mail-in repair'),
                'related': [('tips/samsung-screen-issues', 'Green line, flicker, dead touch or burn-in'), ('tips/cracked-samsung-back-glass', 'Cracked back glass on a Galaxy'),
                            ('tips/samsung-moisture-detected', 'Moisture detected on the port'), ('tips/water-damaged-phone', 'The phone got wet')]},
    'pixel': {'label': 'Google Pixel', 'accent': 'android', 'service': ('android-repair', 'Pixel and Android repair'), 'mailin': ('mail-in-repair', 'Mail-in repair'),
              'related': [('tips/phone-screen-problems', 'Phone screen problems, by symptom'), ('tips/swollen-phone-battery-screen-lifting', 'Screen or back lifting'),
                          ('tips/phone-charges-slowly', 'Charges slowly or not at all'), ('tips/water-damaged-phone', 'The phone got wet')]},
    'ipad': {'label': 'iPad', 'accent': 'ipad', 'service': ('tablet-repair', 'iPad and tablet repair'), 'mailin': ('mail-in/ipad', 'Mail-in iPad repair'),
             'related': [('tips/cracked-ipad-screen', 'Cracked iPad screen: two tests first'), ('tips/apple-pencil-not-working', 'Apple Pencil not working'),
                         ('tips/bent-phone-or-ipad', 'A bent iPad'), ('tips/backup-before-repair', 'Back up before a repair')]},
    'macbook': {'label': 'MacBook', 'accent': 'macbook', 'service': ('macbook-repair', 'MacBook repair'), 'mailin': ('mail-in/macbook', 'Mail-in MacBook repair'),
                'related': [('tips/laptop-screen-black-but-running', 'Screen black but the Mac is running'), ('tips/laptop-battery-dying', 'Battery dying fast'),
                            ('tips/spilled-liquid-on-laptop', 'Spilled liquid on the keyboard'), ('tips/macbook-pro-stage-light', 'MacBook Pro stage light')]},
}

# ─── Models. Rows are matched to the data file by exact device name. ───
MODELS = []
IPHONE_ORDER = ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2020)', 'iPhone SE (2022)',
                'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
                'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
                'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
                'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
                'iPhone 16e', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
                'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max']
for name in IPHONE_ORDER:
    MODELS.append({'family': 'iphone', 'name': name, 'slug': slugify(name), 'devices': [name], 'short': name.replace('iPhone ', '')})

CONSOLES = [
    {'name': 'PS5', 'full': 'PlayStation 5', 'slug': 'ps5', 'devices': ['PS5 / PS5 Slim / PS5 Pro', 'PS5 (all models)', 'PS5 (disc models)', 'PS4 / PS5'], 'service': ('ps5-repair', 'PS5 repair')},
    {'name': 'PS5 controller', 'full': 'PS5 DualSense controller', 'slug': 'ps5-controller', 'devices': ['PS5 DualSense']},
    {'name': 'PS4', 'full': 'PlayStation 4', 'slug': 'ps4', 'devices': ['PS4 / Slim / Pro', 'PS4 / PS5']},
    {'name': 'Xbox Series X|S', 'full': 'Xbox Series X and Series S', 'slug': 'xbox-series-x', 'devices': ['Xbox Series X / S', 'Xbox Series X / One', 'Xbox (disc models)', 'Xbox (all)'],
     'tips': {'HDMI Port': ('tips/xbox-series-x-no-signal-hdmi', 'No signal on the TV? Test this first')}},
    {'name': 'Xbox One', 'full': 'Xbox One, One S and One X', 'slug': 'xbox-one', 'devices': ['Xbox One / One S / One X', 'Xbox Series X / One', 'Xbox (disc models)', 'Xbox (all)'], 'tips': {'HDMI Port': None, 'Disc Drive': None, 'Thermal Repaste + Deep Clean': None}},
    {'name': 'Xbox controller', 'full': 'Xbox Wireless and Elite controller', 'slug': 'xbox-controller', 'devices': ['Xbox Wireless / Elite'], 'tips': {'Stick Drift Fix': None}},
    {'name': 'Nintendo Switch', 'full': 'Nintendo Switch, Lite, OLED and Switch 2', 'slug': 'nintendo-switch', 'devices': ['Switch (V1 / V2)', 'Switch Lite', 'Switch OLED', 'Switch 2', 'Switch (all models)'],
     'tips': {'USB-C Charge Port': ('tips/nintendo-switch-wont-turn-on', 'Switch won’t turn on or charge'), 'Game Card Reader': None, 'Fan Replacement': None, 'Battery': ('tips/nintendo-switch-wont-turn-on', 'Switch won’t turn on or charge')}},
    {'name': 'Joy-Con', 'full': 'Nintendo Joy-Con', 'slug': 'joy-con', 'devices': ['Joy-Con (pair)', 'Joy-Con (single)'], 'tips': {'Stick Drift Fix': ('tips/switch-joycon-drift', 'Joy-Con drift: what to try first')}},
]
for c in CONSOLES:
    MODELS.append({'family': 'console', **c, 'short': c['name']})

GALAXY_S = ['Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra', 'Galaxy S21 FE', 'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
            'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE', 'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE',
            'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra']
for name in GALAXY_S:
    MODELS.append({'family': 'samsung', 'name': name, 'full': f'Samsung {name}', 'slug': slugify(f'samsung {name}'),
                   'devices': [name, 'Galaxy S21–S25 (any)'], 'short': name.replace('Galaxy ', '')})
for name, device, short in [('Galaxy A14, A15 and A16', 'Galaxy A14 / A15 / A16', 'A14–A16'), ('Galaxy A53 and A54', 'Galaxy A53 / A54', 'A53 / A54'),
                            ('Galaxy A55 and A56', 'Galaxy A55 / A56', 'A55 / A56')]:
    MODELS.append({'family': 'samsung', 'name': name, 'full': f'Samsung {name}', 'slug': slugify('samsung ' + device),
                   'devices': [device, 'Galaxy A-series (any)'], 'short': short})
for name in ['Pixel 7', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a', 'Pixel 9', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9a']:
    MODELS.append({'family': 'pixel', 'name': name, 'full': f'Google {name}', 'slug': slugify(f'google {name}'),
                   'devices': [name, 'Pixel 7–9a (any)'], 'short': name.replace('Pixel ', '')})
IPADS = [
    ('iPad 5th and 6th gen', 'ipad-5-6', ['iPad 5 / 6 (2017–18)', 'iPad 5 / 6'], '5th / 6th gen'),
    ('iPad 7th, 8th and 9th gen', 'ipad-7-8-9', ['iPad 7 / 8 / 9 (10.2")', 'iPad 7 / 8 / 9'], '7th–9th gen'),
    ('iPad 10th gen', 'ipad-10', ['iPad 10 (2022)', 'iPad 10 / 11 (A16)'], '10th gen'),
    ('iPad 11th gen (A16)', 'ipad-11-a16', ['iPad 11 (A16, 2025)', 'iPad 10 / 11 (A16)'], '11th gen'),
    ('iPad mini 5', 'ipad-mini-5', ['iPad mini 5 (2019)', 'iPad mini / Air (any)'], 'mini 5'),
    ('iPad mini 6', 'ipad-mini-6', ['iPad mini 6 (2021)', 'iPad mini / Air (any)'], 'mini 6'),
    ('iPad mini 7 (A17 Pro)', 'ipad-mini-7', ['iPad mini 7 (A17 Pro)', 'iPad mini / Air (any)'], 'mini 7'),
    ('iPad Air 3', 'ipad-air-3', ['iPad Air 3 (2019)', 'iPad mini / Air (any)'], 'Air 3'),
    ('iPad Air 4 and 5', 'ipad-air-4-5', ['iPad Air 4 / 5 (2020–22)', 'iPad mini / Air (any)'], 'Air 4 / 5'),
    ('iPad Air 11" (M2, M3, M4)', 'ipad-air-11-m2-m3-m4', ['iPad Air 11" (M2/M3/M4)', 'iPad mini / Air (any)'], 'Air 11"'),
    ('iPad Air 13" (M2, M3, M4)', 'ipad-air-13-m2-m3-m4', ['iPad Air 13" (M2/M3/M4)', 'iPad mini / Air (any)'], 'Air 13"'),
    ('iPad Pro 11" (2nd gen, 2020)', 'ipad-pro-11-2nd-gen', ['iPad Pro 11" (2nd gen, 2020)', 'iPad Pro (any)'], 'Pro 11" 2nd gen'),
    ('iPad Pro 11" (3rd gen, 2021)', 'ipad-pro-11-3rd-gen', ['iPad Pro 11" (3rd gen, 2021)', 'iPad Pro (any)'], 'Pro 11" 3rd gen'),
    ('iPad Pro 11" (4th gen, 2022)', 'ipad-pro-11-4th-gen', ['iPad Pro 11" (4th gen, 2022)', 'iPad Pro (any)'], 'Pro 11" 4th gen'),
    ('iPad Pro 11" (M4, 2024)', 'ipad-pro-11-m4', ['iPad Pro 11" (5th gen, 2024)', 'iPad Pro (any)'], 'Pro 11" M4'),
    ('iPad Pro 11" (M5, 2025)', 'ipad-pro-11-m5', ['iPad Pro 11" (6th gen, 2025)', 'iPad Pro (any)'], 'Pro 11" M5'),
    ('iPad Pro 12.9" (3rd and 4th gen)', 'ipad-pro-12-9-3rd-4th-gen', ['iPad Pro 12.9" (3rd-4th gen, 2020)', 'iPad Pro (any)'], 'Pro 12.9" 3rd / 4th'),
    ('iPad Pro 12.9" (5th gen)', 'ipad-pro-12-9-5th-gen', ['iPad Pro 12.9" (5th gen, 2022)', 'iPad Pro (any)'], 'Pro 12.9" 5th gen'),
    ('iPad Pro 13" (M4 and M5)', 'ipad-pro-13-m4-m5', ['iPad Pro 13" (M4/M5)', 'iPad Pro (any)'], 'Pro 13"'),
]
for name, slug, devices, short in IPADS:
    MODELS.append({'family': 'ipad', 'name': name, 'slug': slug, 'devices': devices, 'short': short})
MACS = [
    ('Air 13" Retina (2018–19)', 'MacBook Air 13" Retina (2018–2019)', 'Air 13" 2018–19'),
    ('Air 13" (2020, Intel)', 'MacBook Air 13" (2020, Intel)', 'Air 13" Intel 2020'),
    ('Air 13" (M1, 2020)', 'MacBook Air 13" (M1, 2020)', 'Air 13" M1'),
    ('Air 13" (M2, 2022)', 'MacBook Air 13" (M2, 2022)', 'Air 13" M2'),
    ('Air 15" (M2, 2023)', 'MacBook Air 15" (M2, 2023)', 'Air 15" M2'),
    ('Air 13"/15" (M3, 2024)', 'MacBook Air 13" and 15" (M3, 2024)', 'Air M3'),
    ('Air 13"/15" (M4, 2025)', 'MacBook Air 13" and 15" (M4, 2025)', 'Air M4'),
    ('Pro 13" (2019–20, Intel/M1/M2)', 'MacBook Pro 13" (2019–2022)', 'Pro 13"'),
    ('Pro 16" (2019, Intel)', 'MacBook Pro 16" (2019, Intel)', 'Pro 16" Intel'),
    ('Pro 14" (M1 Pro/Max, 2021)', 'MacBook Pro 14" (M1 Pro/Max, 2021)', 'Pro 14" M1'),
    ('Pro 16" (M1 Pro/Max, 2021)', 'MacBook Pro 16" (M1 Pro/Max, 2021)', 'Pro 16" M1'),
    ('Pro 14" (M2/M3, 2023)', 'MacBook Pro 14" (M2 or M3, 2023)', 'Pro 14" M2/M3'),
    ('Pro 16" (M2/M3, 2023)', 'MacBook Pro 16" (M2 or M3, 2023)', 'Pro 16" M2/M3'),
    ('Pro 14" (M4, 2024)', 'MacBook Pro 14" (M4, 2024)', 'Pro 14" M4'),
    ('Pro 16" (M4, 2024)', 'MacBook Pro 16" (M4, 2024)', 'Pro 16" M4'),
]
for device, name, short in MACS:
    MODELS.append({'family': 'macbook', 'name': name, 'slug': slugify(name.replace('"', '-inch')), 'devices': [device], 'short': short})
JOB_ORDER = ['Screen', 'Screen Assembly', 'Glass / Digitizer', 'LCD (under glass)', 'Display', 'Battery', 'Charge Port']


def rows_for(model):
    rows = [r for r in DATA if r['device'] in model['devices']]
    assert rows, f"no prices for {model['name']}"
    if model['family'] == 'iphone':
        order = list(IPHONE_JOBS)
        rows.sort(key=lambda r: order.index(r['job']))
    elif model['family'] in JOB_FAMILY:
        rows.sort(key=lambda r: JOB_ORDER.index(r['job']))
    return rows


SCOPE = {
    'PS5 / PS5 Slim / PS5 Pro': 'PS5, Slim and Pro', 'PS5 (all models)': 'Every PS5 model', 'PS5 (disc models)': 'Disc models',
    'PS4 / PS5': 'PS4 and PS5', 'PS4 / Slim / Pro': 'PS4, Slim and Pro', 'Xbox Series X / S': 'Series X and Series S',
    'Xbox Series X / One': 'Series X and One', 'Xbox (disc models)': 'Disc models', 'Xbox (all)': 'Every Xbox model',
    'Xbox One / One S / One X': 'One, One S and One X', 'Switch (V1 / V2)': 'Original Switch', 'Switch Lite': 'Switch Lite',
    'Switch OLED': 'Switch OLED', 'Switch 2': 'Switch 2', 'Switch (all models)': 'Every Switch model',
    'Galaxy S21–S25 (any)': 'Every Galaxy S21 to S25', 'Galaxy A-series (any)': 'Every Galaxy A model', 'Pixel 7–9a (any)': 'Every Pixel 7 to 9a',
    'iPad 5 / 6': 'iPad 5th and 6th gen', 'iPad 7 / 8 / 9': 'iPad 7th to 9th gen', 'iPad 10 / 11 (A16)': 'iPad 10th and 11th gen',
    'iPad mini / Air (any)': 'Every iPad mini and Air', 'iPad Pro (any)': 'Every iPad Pro',
    'Joy-Con (pair)': 'Both Joy-Con', 'Joy-Con (single)': 'One Joy-Con', 'PS5 DualSense': 'DualSense', 'Xbox Wireless / Elite': 'Wireless and Elite',
}


def job_title(model, row):
    if model['family'] == 'iphone':
        return IPHONE_JOBS[row['job']][0]
    if model['family'] in JOB_FAMILY:
        return JOBS[JOB_FAMILY[model['family']]][row['job']][0]
    job = row['job']
    same = [r for r in DATA if r['device'] in model['devices'] and r['job'] == job]
    if len(same) > 1:  # e.g. four Switch screens: name the model in the job
        return f"{job.split(' (')[0]} · {SCOPE[row['device']]}"
    return job


def scope(model, row):
    if model['family'] == 'iphone':
        return ''
    if model['family'] in JOB_FAMILY:
        return SCOPE.get(row['device'], '')
    return SCOPE[row['device']]


def job_detail(model, row):
    """(what it is, grade words, tip link)"""
    if model['family'] == 'iphone':
        _, what, tip, tip_label = IPHONE_JOBS[row['job']]
        grade = GRADES.get(row['grade'], row['grade'])
        if row['job'] == 'Screen' and row['grade'] == 'Incell LCD':
            grade += ' This model shipped with an LCD, so the picture is the same kind it had.' if model['name'] in LCD_NATIVE else ' This model shipped with an OLED, so blacks look grayer than the original.'
        return what, grade, (tip, tip_label)
    if model['family'] in JOB_FAMILY:
        _, what, tip, tip_label = JOBS[JOB_FAMILY[model['family']]][row['job']]
        if model['family'] == 'pixel' and row['job'] == 'Screen':
            tip, tip_label = 'tips/phone-screen-problems', 'Phone screen problems, by symptom'
        return what, GRADES.get(row['grade'], row['grade']), (tip, tip_label)
    tips = dict(CONSOLE_TIPS)
    tips.update(model.get('tips', {}))
    tip = tips.get(row['job'])
    return '', row['grade'], tip


def template_parts():
    source = (ROOT / 'tips/iphone-not-ringing.html').read_text()
    nav = source[source.index('<!-- shared-navigation:start -->'):source.index('<!-- shared-navigation:end -->') + len('<!-- shared-navigation:end -->')]
    # The borrowed header marks the tips library as the current section; these pages belong under Pricing.
    nav = nav.replace('<a class="nav-link active" aria-current="location" href="/tips">', '<a class="nav-link" href="/tips">')
    nav = nav.replace('<a class="nav-link" href="/pricing">', '<a class="nav-link active" aria-current="location" href="/pricing">')
    tail = source[source.index('<footer class="fg-footer">'):]
    tail = re.sub(r'<script src="/assets/repair-tip-pages\.js[^"]*" defer></script>', '', tail)
    return nav, tail


def head(title, description, url, schema):
    title, description = escape(title), escape(description)
    return f'''<!DOCTYPE html>
<html lang="en" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="ai-access" content="allow"><meta name="ai-training" content="allow"><meta name="ai-content-type" content="page">
<title>{title}</title><meta name="description" content="{description}"><meta name="theme-color" content="#0b0f14">
<link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{url}"><meta property="og:image" content="{ORIGIN}/og-image.svg"><meta property="og:image:alt" content="Hailey Device Repair"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{description}"><meta name="twitter:image" content="{ORIGIN}/og-image.svg">
<link rel="icon" href="/favicon.ico"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@700;800;900&amp;family=Inter:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/material-symbols.css"><link rel="stylesheet" href="/assets/css/bench-tips.css?v=quiet-20260708"><link rel="stylesheet" href="/assets/css/repair-tip-pages.css?v=20260902"><link rel="stylesheet" href="/assets/css/site-navigation.css?v=20260911"><link rel="stylesheet" href="/nav-quote.css?v=20260709"><link rel="stylesheet" href="/assets/css/quick-find.css?v=20260906"><link rel="stylesheet" href="/assets/css/site-polish.css?v=20260906"><link rel="stylesheet" href="/assets/css/site-design.css?v=20260906"><link rel="stylesheet" href="/assets/css/repair-field-guides.css?v=20260911"><link rel="stylesheet" href="/assets/css/repair-prices.css?v={CSS_VERSION}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, separators=(',', ':'))}</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>'''


def ticket(model, rows):
    lines = ''
    for r in rows:
        lines += (f'<li><span class="rp-ticket__job">{escape(job_title(model, r))}</span>'
                  f'<span class="rp-ticket__dots" aria-hidden="true"></span>'
                  f'<span class="rp-ticket__p">{escape(r["price"])}</span><span class="rp-ticket__m">{escape(r["mailin"])}</span></li>')
    return f'''<aside class="rp-ticket" aria-label="{escape(model['name'])} price summary">
<div class="rp-ticket__top"><span>HDR · Repair ticket</span><span>{escape(model['short'])}</span></div>
<div class="rp-ticket__cols" aria-hidden="true"><span></span><span>Bench</span><span>By mail</span></div>
<ul>{lines}</ul>
<div class="rp-ticket__perf" aria-hidden="true"></div>
<p class="rp-ticket__foot"><strong>Quote first.</strong> Every job is confirmed by text before work starts. Mail-in prices include tracked return shipping.</p>
<span class="rp-stamp" aria-hidden="true">40-day<br>warranty</span>
</aside>'''


def card(model, row, index):
    what, grade, tip = job_detail(model, row)
    note = row.get('note', '')
    tip_html = f'<a class="rp-card__tip" href="/{tip[0]}">{escape(tip[1])} {ARROW}</a>' if tip else ''
    what_html = f'<p class="rp-card__what">{escape(what)}</p>' if what else ''
    grade_html = f'<p class="rp-card__grade"><span>Part</span>{escape(grade)}</p>' if grade else ''
    note_html = f'<p class="rp-card__note">{escape(note)}</p>' if note else ''
    fit = scope(model, row)
    fits = f'<span class="rp-card__fits">{escape(fit)}</span>' if fit and fit not in job_title(model, row) else ''
    return f'''<article class="rp-card" id="{slugify(row['job'] + '-' + row['device'])}">
<header><span class="rp-card__n">{index:02d}</span><h3>{escape(job_title(model, row))}</h3>{fits}</header>
<div class="rp-card__prices"><div><small>At the bench</small><strong>{escape(row['price'])}</strong></div><div class="rp-card__mail"><small>By mail</small><strong>{escape(row['mailin'])}</strong><span>return shipping included</span></div></div>
{what_html}{grade_html}{note_html}{tip_html}
</article>'''


STEPS = [
    ('Text the model and what broke', 'A photo of the damage helps. You get a firm quote back before anything ships.'),
    ('Pack it and send it', 'Power it off, take off the case, wrap it well and ship it from anywhere in the lower 48 with USPS, UPS or FedEx. Postage to us is yours.'),
    ('Repaired on the bench', 'You get a text when it arrives. Most repairs are finished in 1–2 days, depending on the job, and anything unexpected is texted to you before extra work.'),
    ('Pay, then it ships back', 'The invoice comes by text or email. Once it is paid, it ships back tested and tracked, with return postage on us.'),
]


def build_model(model, nav, tail):
    fam = FAMILIES[model['family']]
    rows = rows_for(model)
    url = f"{ORIGIN}/repair/{model['slug']}"
    name = model['name']
    full = model.get('full', name)
    low = min(rows, key=lambda r: money(r['price']))
    if model['family'] == 'iphone':
        by = {r['job']: r for r in rows}
        title = f"{name} Repair Cost: Screen {by['Screen']['price']}, Battery {by['Battery']['price']}"
        description = (f"{name} screen {by['Screen']['price']}, battery {by['Battery']['price']}, charging port {by['Charge Port']['price']}, back glass {by['Back Glass']['price']}. "
                       f"By mail from {low['mailin']} with return shipping included. Quote first, 40-day warranty.")
        answer = (f"An {name} screen replacement is {by['Screen']['price']} at our Hailey, Idaho bench, or {by['Screen']['mailin']} by mail with return shipping included. "
                  f"A battery is {by['Battery']['price']} ({by['Battery']['mailin']} by mail). Every job gets a firm quote by text before any work starts.")
    elif model['family'] in JOB_FAMILY:
        lead = rows[0]
        lead_word = job_title(model, lead).replace(' replacement', '').replace(' repair', '')
        battery = next((r for r in rows if r['job'] == 'Battery'), None)
        tail_bit = f", Battery {battery['price']}" if battery and battery is not lead else ''
        options = [f"{full} Repair Cost: {lead_word} {lead['price']}{tail_bit}", f"{name} Repair Cost: {lead_word} {lead['price']}{tail_bit}",
                   f"{name} Repair Cost: {lead_word} {lead['price']}", f"{name} Repair Prices"]
        title = next(t for t in options if len(t) <= 60)
        parts = ', '.join(f"{job_title(model, r).lower()} {r['price']}" for r in rows[:3])
        description = f"{full} {parts}. By mail from {low['mailin']} with return shipping included. Quote first, 40-day warranty."
        if len(description) > 160:
            description = f"{full} {job_title(model, lead).lower()} {lead['price']}. By mail from {low['mailin']} with return shipping included. Quote first, 40-day warranty."
        article = 'An' if full[:1] in 'AEIOU' or full.startswith('iPad') else 'A'
        answer = (f"{article} {full} {job_title(model, lead).lower()} is {lead['price']} at our Hailey, Idaho bench, or {lead['mailin']} by mail with return shipping included. "
                  + (f"A battery is {battery['price']} ({battery['mailin']} by mail). " if battery and battery is not lead else '')
                  + "Every job gets a firm quote by text before any work starts.")
    else:
        first = rows[0]
        title = f"{name} Repair Prices: {job_title(model, first).split(' · ')[0]} {first['price']} and More"
        if len(title) > 60:
            title = f"{name} Repair Prices, from {low['price']}"
        jobs = ', '.join(f"{job_title(model, r).lower()} {r['price']}" for r in rows[:4])
        description = f"{full} repair prices: {jobs}. By mail with return shipping included. Firm quote first, 40-day warranty."
        if len(description) > 155:
            description = f"{full} repair prices from {low['price']}, by mail from {low['mailin']} with return shipping included. Firm quote first, 40-day warranty."
        answer = (f"{full} repairs start at {low['price']} at our Hailey, Idaho bench, or {low['mailin']} by mail with return shipping included. "
                  "Each price below is from the published menu, and every job gets a firm quote by text before any work starts.")
    title = title.replace('&', 'and').replace(' controller Repair', ' Controller Repair')
    offers = [{'@type': 'Offer', 'name': f"{name} {r['job'].lower()}" + (f" ({SCOPE[r['device']].lower()})" if model['family'] == 'console' else ''),
               'price': str(money(r['price'])), 'priceCurrency': 'USD', 'url': url} for r in rows]
    schema = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebPage', '@id': f'{url}#page', 'url': url, 'name': title, 'description': description,
         'dateModified': CHECKED, 'author': PERSON, 'publisher': {'@id': f'{ORIGIN}/#business'},
         'isPartOf': {'@id': f'{ORIGIN}/repair#page'}, 'mainEntity': {'@id': f'{url}#service'}},
        {'@type': 'Service', '@id': f'{url}#service', 'name': f'{name} repair', 'serviceType': f'{name} repair',
         'provider': {'@id': f'{ORIGIN}/#business'},
         'offers': {'@type': 'AggregateOffer', 'priceCurrency': 'USD', 'lowPrice': str(min(money(r['price']) for r in rows)),
                    'highPrice': str(max(money(r['mailin']) for r in rows)), 'offerCount': len(offers), 'offers': offers}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{ORIGIN}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Repair prices', 'item': f'{ORIGIN}/repair'},
            {'@type': 'ListItem', 'position': 3, 'name': name, 'item': url}]},
    ]}
    cards = '\n'.join(card(model, r, i) for i, r in enumerate(rows, 1))
    steps = ''.join(f'<li><span>{i:02d}</span><strong>{escape(a)}</strong><p>{escape(b)}</p></li>' for i, (a, b) in enumerate(STEPS, 1))
    siblings = [m for m in MODELS if m['family'] == model['family']]
    pos = siblings.index(model)
    sib_links = ''.join(
        f'<a href="/repair/{m["slug"]}"{" aria-current=\"page\"" if m is model else ""}>{escape(m["short"])}</a>' for m in siblings)
    prev_next = ''
    if pos > 0:
        p = siblings[pos - 1]
        prev_next += f'<a class="rp-pn rp-pn--prev" href="/repair/{p["slug"]}"><small>Previous</small>{escape(p["name"])}</a>'
    if pos < len(siblings) - 1:
        n = siblings[pos + 1]
        prev_next += f'<a class="rp-pn rp-pn--next" href="/repair/{n["slug"]}"><small>Next</small>{escape(n["name"])}</a>'
    service = model.get('service', fam['service'])
    related = ''.join(f'<a href="/{h}">{escape(t)} {ARROW}</a>' for h, t in fam['related'])
    grade_note = ''
    if model['family'] == 'iphone':
        grade_note = '<p class="rp-fine">Hidden damage, such as a bent frame, liquid or a board fault, is confirmed with you before any work.</p>'
    else:
        grade_note = '<p class="rp-fine">Hidden damage, such as liquid or a board fault found on the bench, is confirmed with you before any work.</p>'
    return head(title, description, url, schema) + f'''
<body class="bench-tips-page fg-page rp-page rp-page--{fam['accent']}"><a class="fg-skip" href="#content">Skip to prices</a>
{nav}
<main id="content" tabindex="-1">
<header class="fg-hero rp-hero"><div class="fg-wrap">
<nav class="fg-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/repair">Repair prices</a><span>/</span><span>{escape(name)}</span></nav>
<div class="rp-hero__grid"><div class="rp-hero__copy"><p class="fg-kicker">{escape(fam['label'])} · Repair prices</p><h1>{escape(name)} repair&nbsp;prices</h1>
<p class="fg-byline"><a href="/about" rel="author">Samuel</a>, Owner &amp; Technician <span>·</span> Prices checked <time datetime="{CHECKED}">{CHECKED_LABEL}</time></p>
<p class="rp-answer">{escape(answer)}</p>
<div class="rp-cta"><a class="rp-btn rp-btn--main" href="{SMS}">Text for a quote {ARROW}</a><a class="rp-btn" href="/{fam['mailin'][0]}">How mail-in works</a></div>
<p class="rp-cta__alt">Or call <a href="{TEL}">{PHONE}</a></p></div>
{ticket(model, rows)}
</div></div></header>
<div class="fg-wrap rp-body">
<section class="rp-section" aria-labelledby="jobs-title"><header class="rp-section__head"><p class="fg-kicker">01 / The jobs</p><h2 id="jobs-title">What each price covers</h2></header>
<div class="rp-cards">{cards}</div>{grade_note}</section>
<section class="rp-section rp-mail" aria-labelledby="mail-title"><header class="rp-section__head"><p class="fg-kicker">02 / By mail</p><h2 id="mail-title">Send it in, get it back fixed</h2></header>
<ol class="rp-steps">{steps}</ol>
<div class="rp-mail__end"><p>Not near Hailey? This is how most {escape(name)} repairs reach the bench, from any state in the lower 48.</p><a class="rp-btn rp-btn--main" href="{SMS}">Text the model and the problem {ARROW}</a><a class="rp-btn" href="/{fam['mailin'][0]}">{escape(fam['mailin'][1])}</a></div></section>
<section class="rp-section" aria-labelledby="more-title"><header class="rp-section__head"><p class="fg-kicker">03 / Before you send it</p><h2 id="more-title">Not sure it’s the part?</h2></header>
<div class="rp-related">{related}<a href="/{service[0]}">{escape(service[1])} {ARROW}</a><a href="/device-check">Device Check: a few questions, then an estimate {ARROW}</a></div></section>
<nav class="rp-models" aria-label="Other {escape(fam['label'])} models"><p class="fg-kicker">Other {escape(fam['label'])} prices</p><div class="rp-models__list">{sib_links}</div><div class="rp-models__pn">{prev_next}</div><a class="rp-models__all" href="/repair">Every model we price {ARROW}</a></nav>
</div></main>{tail}'''


def build_index(nav, tail):
    url = f'{ORIGIN}/repair'
    title = 'Repair Prices by Model: iPhone, Galaxy, iPad, MacBook'
    description = 'Find the repair price for your exact model: iPhone, Samsung Galaxy, Google Pixel, iPad, MacBook, PS5, Xbox and Switch. Bench and mail-in prices, quote first.'
    schema = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', '@id': f'{url}#page', 'url': url, 'name': title, 'description': description,
         'dateModified': CHECKED, 'author': PERSON, 'publisher': {'@id': f'{ORIGIN}/#business'},
         'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(MODELS), 'itemListElement': [
             {'@type': 'ListItem', 'position': i, 'url': f"{ORIGIN}/repair/{m['slug']}", 'name': f"{m['name']} repair prices"}
             for i, m in enumerate(MODELS, 1)]}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{ORIGIN}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Repair prices', 'item': url}]},
    ]}
    groups = ''
    for key, fam in FAMILIES.items():
        tiles = ''
        for m in [m for m in MODELS if m['family'] == key]:
            rows = rows_for(m)
            low = min(money(r['price']) for r in rows)
            first = rows[0]
            if key == 'iphone':
                hint = f"Screen {first['price']}"
            elif key in JOB_FAMILY:
                hint = f"{job_title(m, first).replace(' and touch', '').replace(' replacement', '').replace(' repair', '')} {first['price']}"
            else:
                hint = f"{len(rows)} repairs" if len(rows) > 1 else "1 repair"
            label = {'samsung': m['name'].replace('Galaxy ', ''), 'ipad': m['name'].replace('iPad ', ''), 'macbook': m['short']}.get(key, m['name'])
            aria = f' aria-label="{escape(m["name"])} repair prices"' if label != m['name'] else ''
            tiles += (f'<a class="rp-tile" href="/repair/{m["slug"]}"{aria}><strong>{escape(label)}</strong>'
                      f'<span>{escape(hint)}</span><small>from ${low}</small>{ARROW}</a>')
        groups += (f'<section class="rp-section rp-index rp-page--{fam["accent"]}" aria-labelledby="g-{key}"><header class="rp-section__head">'
                   f'<h2 id="g-{key}">{escape(fam["label"])}</h2></header><div class="rp-tiles">{tiles}</div></section>')
    return head(title, description, url, schema) + f'''
<body class="bench-tips-page fg-page rp-page rp-page--index"><a class="fg-skip" href="#content">Skip to models</a>
{nav}
<main id="content" tabindex="-1">
<header class="fg-hero rp-hero"><div class="fg-wrap">
<nav class="fg-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Repair prices</span></nav>
<div class="rp-hero__copy rp-hero__copy--wide"><p class="fg-kicker">Repair prices · By model</p><h1>Repair prices, model by&nbsp;model.</h1>
<p class="rp-answer">Each model has its own page with the bench price, the mail-in price with return shipping included, the part we fit and what the job covers. Every job still gets a firm quote by text before work starts.</p>
<div class="rp-cta"><a class="rp-btn rp-btn--main" href="{SMS}">Text for a quote {ARROW}</a><a class="rp-btn" href="/pricing">Search the full menu</a></div></div>
</div></header>
<div class="fg-wrap rp-body">{groups}
<p class="rp-fine">Don’t see your model? The <a href="/pricing">full price menu</a> covers more, or text the model for a one-message quote.</p>
</div></main>{tail}'''


def main():
    nav, tail = template_parts()
    (ROOT / 'repair').mkdir(exist_ok=True)
    for m in MODELS:
        (ROOT / f"repair/{m['slug']}.html").write_text(build_model(m, nav, tail))
    (ROOT / 'repair.html').write_text(build_index(nav, tail))
    print(f'Repair price pages: {len(MODELS)} models + index built.')


if __name__ == '__main__':
    main()
