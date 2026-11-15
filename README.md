# RingForge Studio — download site

Download page for **RingForge Studio**, a fan-made Sonic ROM editor.

## Site

Plain static HTML/CSS/JS, no build step:

- `index.html` — the page
- `style.css` — styles
- `script.js` — starfield, collectible rings, palette playground, easter eggs
- `downloads/RingForgeStudio.zip` — the release (see `downloads/README.md`)

### Publish with GitHub Pages

1. Merge into `main`.
2. Repo **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**.
3. The site goes live at `https://<your-username>.github.io/ringforgedownload/`.

### Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Easter eggs

- Collect floating rings (hover or tap). 100 rings = 1UP.
- Click the big ring in the hero for a ring jackpot.
- Press **H** to get hit and drop your rings.
- ↑ ↑ ↓ ↓ ← → ← → B A = super mode.

_Unofficial fan project, not affiliated with SEGA._
