# Hailey Device Repair — Website

Static site for [haileyrepair.com](https://haileyrepair.com).

Dark theme inspired by codewiki.google's design language. No build step required.

## Files

| File | Description |
|------|-------------|
| `index.html` | Full single-page site |
| `style.css` | Dark/light theme CSS |
| `main.js` | Theme toggle, animations, form, smooth scroll |
| `favicon.svg` | SVG favicon |
| `vercel.json` | Vercel deploy config |
| `robots.txt` | SEO crawl rules |

## Deploy to Vercel

### Option 1: Drag & Drop
1. Go to [vercel.com](https://vercel.com) → New Project
2. Drag the `hdr-website/` folder into the deploy area
3. Done — it's live

### Option 2: Git Push
1. Push this folder to a GitHub repo
2. Import the repo in Vercel
3. No build command needed (static site)
4. Output directory: leave blank (root)

### Custom Domain
- Add `haileyrepair.com` in Vercel project settings → Domains
- Point your domain DNS to Vercel's nameservers

## Customization Notes

- **Contact form**: Currently uses `mailto:` fallback. For production, connect to Formspree or a serverless function to receive emails without opening a mail client.
- **Reviews**: The three testimonials are placeholders — swap in real Google reviews as they come in.
- **Hours**: Currently set to Mon–Sat 9am–7pm MT. Update in `index.html` contact section.
- **Google Maps**: Can embed a `<iframe>` map in the contact section if desired.

## Tech Stack

- Plain HTML + CSS + vanilla JS
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
- [Material Symbols](https://fonts.google.com/icons) for icons
- Zero dependencies, zero build step
