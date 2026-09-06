# Hailey Device Repair

Static HTML, CSS, and vanilla JavaScript for [haileyrepair.com](https://www.haileyrepair.com). Vercel serves the root directory with clean URLs defined in `vercel.json`.

## Local development

Run `python3 scripts/serve.py` and open `http://localhost:8080`. This preview supports extensionless routes, including `/tips` alongside the `tips/` directory. Use `--port 8081` if the default port is busy.

After editing `main.js` or `style.css`, run:

```sh
bash build.sh
```

Pages load `main.min.js` and `style.min.css`; edit the source files and rebuild instead of editing the generated files. Reload the browser after changes. The build also updates Quick Find's additional search entries from the sitemap and page metadata.

## Shared files

- `main.js`: navigation, quote form, Quick Find, FAQs, Device Check, and other shared interactions.
- `style.css`: the main design system; many pages also have their own inline styles.
- `assets/css/site-polish.css`: shared responsive and interaction fixes.
- `assets/css/site-design.css`: shared art direction, loaded last on every public page; includes the photographic homepage, personal About introduction, paper quote form, FAQs, and mobile pricing layout.
- `nav-quote.css`: shared navigation quote button styling.
- `assets/site-navigation.js` and `assets/css/quick-find.css`: generated navigation/search assets for pages that do not load the full main script. Their source stays in `main.js` and `style.css`.
- `assets/css/bench-tips.css` and `repair-tip-pages.css`: editorial repair guide layouts.
- `analytics-consent.js`: Google Analytics loading after an explicit opt-in.
- `assets/pricing-data.json` and `scripts/build-pricing.py`: pricing data and table generation. Review generated prices before deploying.
- `sitemap.xml`: published pages and the source of Quick Find's coverage checks.

## Checks

```sh
python3 scripts/audit-site.py
node scripts/audit-indexability.mjs
node --test scripts/test-site-interactions.mjs scripts/test-repair-phone.mjs scripts/test-repair-inspection.mjs
```

The site audit checks every public page, local link, anchor, image reference, and shared finishing stylesheets. Indexability checks titles, descriptions, canonical URLs, and structured data for every sitemap page. Interaction tests use mocked delivery; they do not send messages to the business.

The optional `node scripts/audit-indexability.mjs --live` checks the deployed site's priority routes.

## Quote requests

The homepage and contact form use Formspree via each form's `data-formspree` setting. If a form has no endpoint, the shared script opens an email draft and keeps the visitor's details available. Never treat opening that draft as successful delivery.

## Deployment

Vercel publishes the static root; no server or package install is required. Run the build and checks before deploying. `.vercelignore` excludes source documents, scripts, archived pages, and working materials.
