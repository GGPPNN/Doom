# DOOM — browser IWAD launcher

Choose the hosted DOOM II IWAD or select an IWAD from your device. The launcher passes the selected IWAD to a browser-compiled `doomgeneric` engine. Local uploads are read in the browser and are never sent to the server.

## Run the site

Serve the repository over HTTP(S), such as with GitHub Pages or `python3 -m http.server`. The engine must be present at `engine/doomgeneric.js` for gameplay to start. That file is a self-contained Emscripten build (the WASM is embedded in the JavaScript).

## Build the browser engine

The launcher uses the open-source [doomgeneric-WASM-builder](https://github.com/Kinsman4249/doomgeneric-WASM-builder), which compiles the original vanilla Doom engine for browsers. It is **not GZDoom/UZDoom** and does not run ZScript, UDMF, or GZDoom-specific mods.

On a supported Debian/Ubuntu or Fedora system, build the runtime using the builder's documented steps:

```bash
git clone --branch v2.5.0 https://github.com/Kinsman4249/doomgeneric-WASM-builder.git
cd doomgeneric-WASM-builder
chmod +x install.sh
./install.sh
```

When the build finishes, copy the generated `doomgeneric.js` from `~/doomgeneric/doomgeneric/doomgeneric.js` into this repository as `engine/doomgeneric.js`. Create the `engine/` directory first if needed. Then serve this repository over HTTP(S) and reload the page.

The builder downloads and builds third-party source code, so review its installation instructions and license before running it. The resulting engine is GPL-licensed; preserve and provide the required source and license notices when you distribute a built copy.

## Add hosted IWADs

Place each WAD at a path served by the site and add an entry to `wad-library.json`:

```json
[
  {
    "id": "doom2",
    "name": "DOOM II",
    "description": "Doom II IWAD",
    "file": "./Doom2.wad"
  },
  {
    "id": "my-game",
    "name": "My game",
    "description": "Optional short description",
    "file": "./wads/my-game.wad"
  }
]
```

Only host WADs you are legally allowed to distribute. Players can instead choose their own IWAD using **Choose IWAD**; local files remain in memory for that browser session. This initial vanilla engine expects an IWAD, not a standalone PWAD/mod.

## Controls and current limits

Use the keyboard controls supported by the engine (WASD/arrows, Ctrl to fire, Space to use; click the game canvas first). The current integration starts the engine with the selected IWAD. It is a first playable attempt; browser compatibility and the hosted WASM build still need to be tested on the deployed site.
