# RingForge Studio — download site

Download page for **RingForge Studio**, a fan-made Sonic ROM editor.

## Site

Plain static HTML/CSS/JS, no build step. Everything served lives in `public/`:

- `public/index.html` — the page
- `public/style.css` — styles
- `public/script.js` — starfield, collectible rings, palette playground, easter eggs
- `public/downloads/RingForgeStudio.zip` — the release (see `public/downloads/README.md`)

### Deploy (Cloudflare Workers)

`wrangler.jsonc` serves `public/` as static assets and includes the
`previews` block that `npx wrangler preview` needs. Cloudflare Workers
Builds picks it up automatically on push.

Cloudflare rejects any single file over 25 MiB, so the zip must be under that.

### Preview locally

```bash
python3 -m http.server 8000 --directory public
```

Then open http://localhost:8000.

## Easter eggs

- Collect floating rings (hover or tap). 100 rings = 1UP.
- Click the big ring in the hero for a ring jackpot.
- Press **H** to get hit and drop your rings.
- ↑ ↑ ↓ ↓ ← → ← → B A = super mode.

_Unofficial fan project, not affiliated with SEGA._
