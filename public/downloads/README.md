# Downloads

`RingForgeStudio.zip` is bigger than Cloudflare's 25 MiB per-file limit,
so it's stored in 20 MiB pieces in `parts/`. `manifest.json` lists the
pieces, the total size and the SHA-256 of the full zip.

When someone clicks Download, `script.js` fetches the pieces, joins
them in the browser and saves a single `RingForgeStudio.zip`.

## Updating the release

```bash
rm -f parts/*
split -b 20M -d -a 2 /path/to/RingForgeStudio.zip parts/RingForgeStudio.zip.part
```

Then update `manifest.json`: the part paths and sizes, plus `size`
and `sha256` for the whole zip.
