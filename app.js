const manifestUrl = new URL("./wad-library.json", window.location.href);
const engineScriptUrl = new URL("./engine/doomgeneric.js", window.location.href);
const state = { hostedWad: null, selected: null, enginePromise: null, gameStarted: false };
const playButton = document.getElementById("doom2Button");
const buttonHint = document.getElementById("buttonHint");
const statusMessage = document.getElementById("statusMessage");
const wadInput = document.getElementById("wadInput");
const gameOverlay = document.getElementById("gameOverlay");
const gameCanvas = document.getElementById("canvas");

function setStatus(message) {
  statusMessage.textContent = message;
}

function validateIwad(bytes) {
  if (bytes.byteLength < 12) throw new Error("This file is too small to be a valid IWAD.");
  const magic = new TextDecoder("ascii").decode(bytes.subarray(0, 4));
  if (magic !== "IWAD") throw new Error("This is not an IWAD. Choose a main game .wad file, not a PWAD mod.");
}

async function loadHostedWad() {
  try {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load the Doom II game file (${response.status}).`);
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error("The WAD library configuration is invalid.");
    const entry = entries.find((wad) => wad && wad.id === "doom2" && typeof wad.file === "string");
    if (!entry) throw new Error("Doom II is not configured in wad-library.json.");

    state.hostedWad = {
      name: entry.name || "DOOM II",
      fileName: entry.file.split("/").pop() || "Doom2.wad",
      url: new URL(entry.file, manifestUrl).href,
      source: "hosted",
    };
    state.selected = state.hostedWad;
    playButton.disabled = false;
    buttonHint.textContent = "Click to play";
    setStatus("Doom II is ready.");
  } catch (error) {
    playButton.disabled = true;
    buttonHint.textContent = "Unavailable";
    setStatus(error.message);
  }
}

function loadEngine() {
  if (state.enginePromise) return state.enginePromise;

  state.enginePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = engineScriptUrl.href;
    script.onload = () => {
      if (typeof window.DoomModule !== "function") {
        reject(new Error("The browser Doom engine did not initialize correctly."));
        return;
      }
      resolve(window.DoomModule);
    };
    script.onerror = () => reject(new Error("The Doom engine is unavailable. Try again after the site deployment finishes."));
    document.head.append(script);
  });
  return state.enginePromise;
}

function engineWadName(name) {
  const basename = String(name || "doom2.wad").split(/[\\/]/).pop();
  const safeName = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName.toLowerCase().endsWith(".wad") ? safeName : `${safeName}.wad`;
}

async function startGame(wad) {
  if (!wad || state.gameStarted) return;
  state.selected = wad;
  playButton.disabled = true;
  buttonHint.textContent = "Starting…";
  setStatus("Loading Doom. This may take a moment the first time.");

  try {
    const bytes = wad.source === "local"
      ? wad.bytes
      : new Uint8Array(await (await fetch(wad.url)).arrayBuffer());
    validateIwad(bytes);
    const DoomModule = await loadEngine();
    const wadPath = `/${engineWadName(wad.fileName)}`;

    gameOverlay.hidden = false;
    document.body.classList.add("playing");
    document.getElementById("gameTitle").textContent = wad.name;
    state.gameStarted = true;
    setStatus("Starting game… click the game to capture the mouse. Press Esc to release it.");

    const module = await DoomModule({
      canvas: gameCanvas,
      noInitialRun: true,
      print: (text) => console.log(`[DOOM] ${text}`),
      printErr: (text) => console.error(`[DOOM] ${text}`),
      onAbort: (reason) => {
        state.gameStarted = false;
        playButton.disabled = false;
        buttonHint.textContent = "Click to play";
        setStatus(`Doom could not start: ${reason}`);
      },
    });

    module.FS.writeFile(wadPath, bytes);
    module.callMain(["-iwad", wadPath]);
    gameCanvas.focus();
  } catch (error) {
    state.gameStarted = false;
    gameOverlay.hidden = true;
    document.body.classList.remove("playing");
    playButton.disabled = false;
    buttonHint.textContent = "Click to play";
    setStatus(error.message);
  }
}

playButton.addEventListener("click", () => startGame(state.hostedWad));
wadInput.addEventListener("change", async () => {
  const file = wadInput.files?.[0];
  if (!file) return;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    validateIwad(bytes);
    await startGame({ name: file.name, fileName: file.name, bytes, source: "local" });
  } catch (error) {
    setStatus(error.message);
  } finally {
    wadInput.value = "";
  }
});
document.getElementById("exitGameBtn").addEventListener("click", () => window.location.reload());

loadHostedWad();
