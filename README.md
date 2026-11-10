# DOOM — IWAD Launcher

A minimal browser launcher for choosing an IWAD hosted with the site or selecting one from your device.

## Add hosted IWADs

Put the IWAD file in the published site, then add an entry to `wad-library.json`:

```json
[
  {
    "id": "doom2",
    "name": "DOOM II",
    "description": "Hosted IWAD",
    "file": "./Doom2.wad"
  },
  {
    "id": "my-game",
    "name": "My Game",
    "description": "Optional short description",
    "file": "./wads/my-game.wad"
  }
]
```

Each entry needs a unique `id`, a display `name`, and a `file` path relative to the manifest. The existing `Doom2.wad` is listed as the initial hosted game. Only list WAD files that you are authorized to distribute.

## Player uploads

Players can select a `.wad` file with **Choose IWAD**. The file is kept in the current page session and is not uploaded to the website.

## Gameplay status

This version implements IWAD selection only. It does not include a Doom engine, so the Launch button explains that gameplay is not available until a browser/WASM engine is connected. The selected hosted URL or local `File` is available in `app.js` for that integration.

Serve the files over HTTP(S) (for example with GitHub Pages) so the browser can fetch `wad-library.json` and the hosted WAD files.
