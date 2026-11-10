# DOOM II — one-click browser launcher

Open the site and click **DOOM II**. The browser loads the hosted IWAD and WebAssembly engine, then starts the game in the page. Players do not need to install an engine, download files, select an IWAD, or use a separate launcher. The optional “Use a different IWAD” disclosure is only for players who want to provide their own game file.

## Automatic build and deployment

`.github/workflows/deploy.yml` builds the open-source [doomgeneric-WASM-builder](https://github.com/Kinsman4249/doomgeneric-WASM-builder) at the pinned `v2.5.0` tag, assembles the website, and deploys to GitHub Pages on pushes to `main` or manual workflow runs. The generated engine is placed at `engine/doomgeneric.js`; it is not committed to this repository.

A repository owner must enable Pages once under **Settings → Pages → Build and deployment → Source: GitHub Actions**. After that, each push builds and deploys automatically. Players only need to open the deployed page and click **DOOM II**.

## WAD data and distribution

The launcher reads the hosted IWAD path from `wad-library.json`. Add entries for additional games through the same format, and update the page to expose additional launch buttons. Only publish game files you are authorized to distribute. DOOM II data is copyrighted and separate from the open-source engine; confirm your rights before publishing `Doom2.wad` on a public website.

Players may optionally choose a different IWAD from their device. The file stays in browser memory and is not uploaded. The current engine is a vanilla Doom WebAssembly build, **not GZDoom/UZDoom**, so it does not support ZScript, UDMF, or GZDoom-specific mods.

The engine builder is GPL-licensed. Its pinned source and build scripts are available at [doomgeneric-WASM-builder v2.5.0](https://github.com/Kinsman4249/doomgeneric-WASM-builder/tree/v2.5.0); review and comply with the applicable license terms when distributing the generated runtime.
