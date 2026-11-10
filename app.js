const manifestUrl = new URL("./wad-library.json", window.location.href);
const engineScriptUrl = new URL("./engine/doomgeneric.js", window.location.href);
const state = { selected: null, hostedWads: [], enginePromise: null, gameStarted: false };
const grid = document.getElementById("libraryGrid");
const count = document.getElementById("libraryCount");
const selectedName = document.getElementById("selectedName");
const launchButton = document.getElementById("launchBtn");
const statusMessage = document.getElementById("statusMessage");
const wadInput = document.getElementById("wadInput");
const gameOverlay = document.getElementById("gameOverlay");
const gameCanvas = document.getElementById("canvas");

function setStatus(message) {
  statusMessage.textContent = message;
}

function selectWad(wad) {
  state.selected = wad;
  selectedName.textContent = wad.name;
  launchButton.disabled = false;
  launchButton.textContent = wad.name.toLowerCase().includes("doom ii") || wad.name.toLowerCase().includes("doom2")
    ? "Play Doom II"
    : "Play selected IWAD";
  setStatus(wad.source === "local"
    ? "Local IWAD selected. The file stays in this browser session."
    : "Hosted IWAD selected.");
  renderLibrary();
}

function renderLibrary() {
  grid.replaceChildren();
  count.textContent = `${state.hostedWads.length} ${state.hostedWads.length === 1 ? "IWAD" : "IWADs"}`;

  if (!state.hostedWads.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No hosted IWADs are listed yet.";
    grid.append(empty);
    return;
  }

  for (const wad of state.hostedWads) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "wad-card";
    card.classList.toggle("selected", state.selected?.id === wad.id);
    card.setAttribute("aria-pressed", String(state.selected?.id === wad.id));

    const name = document.createElement("strong");
    name.textContent = wad.name;
    const description = document.createElement("span");
    description.textContent = wad.description || "Hosted IWAD";
    const action = document.createElement("span");
    action.className = "card-action";
    action.textContent = state.selected?.id === wad.id ? "Selected" : "Select";

    card.append(name, description, action);
    card.addEventListener("click", () => selectWad(wad));
    grid.append(card);
  }
}

async function loadHostedWads() {
  try {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load WAD list (${response.status}).`);
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error("WAD list must be a JSON array.");

    state.hostedWads = entries.filter((entry) =>
      entry && typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.file === "string"
    ).map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: typeof entry.description === "string" ? entry.description : "",
      url: new URL(entry.file, manifestUrl).href,
      fileName: entry.file.split("/").pop() || `${entry.id}.wad`,
      source: "hosted",
    }));
    renderLibrary();
    if (state.hostedWads.length) selectWad(state.hostedWads[0]);
    else setStatus("Add IWAD entries to wad-library.json to populate this list.");
  } catch (error) {
    count.textContent = "Unavailable";
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Could not load the hosted WAD list. Check wad-library.json.";
    grid.replaceChildren(message);
    setStatus(error.message);
  }
}

function validateIwad(bytes) {
  if (bytes.byteLength < 12) throw new Error("This file is too small to be a valid IWAD.");
  const magic = new TextDecoder("ascii").decode(bytes.subarray(0, 4));
  if (magic !== "IWAD") throw new Error("That file is not an IWAD. Select a game IWAD (.wad), not a PWAD mod.");
}

wadInput.addEventListener("change", async () => {
  const file = wadInput.files?.[0];
  if (!file) return;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    validateIwad(bytes);
    selectWad({ id: "local-iwad", name: file.name, fileName: file.name, bytes, source: "local" });
  } catch (error) {
    setStatus(error.message);
  } finally {
    wadInput.value = "";
  }
});

function loadEngine() {
  if (window.DoomModule) return Promise.resolve(window.DoomModule);
  if (state.enginePromise) return state.enginePromise;

  state.enginePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = engineScriptUrl.href;
    script.onload = () => {
      if (typeof window.DoomModule !== "function") {
        reject(new Error("The Doom engine loaded but did not expose its DoomModule runtime."));
        return;
      }
      resolve(window.DoomModule);
    };
    script.onerror = () => reject(new Error("Browser engine is not installed yet. Build the WASM engine and place doomgeneric.js in the engine/ folder; see README.md."));
    document.head.append(script);
  });
  return state.enginePromise;
}

function engineWadName(name) {
  const safeName = String(name || "doom2.wad").split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName.toLowerCase().endsWith(".wad") ? safeName : `${safeName}.wad`;
}

async function startGame() {
  if (!state.selected || state.gameStarted) return;
  launchButton.disabled = true;
  launchButton.textContent = "Starting…";
  setStatus("Loading the selected IWAD and browser engine…");

  try {
    const wad = state.selected;
    const bytes = wad.source === "local"
      ? wad.bytes
      : new Uint8Array(await (await fetch(wad.url)).arrayBuffer());
    validateIwad(bytes);
    const DoomModule = await loadEngine();
    const wadPath = `/${engineWadName(wad.fileName)}`;

    gameOverlay.hidden = false;
    document.body.classList.add("playing");
    document.getElementById("gameTitle").textContent = wad.name;
    setStatus("Starting Doom. Click the game canvas to focus keyboard controls.");
    state.gameStarted = true;

    DoomModule({
      canvas: gameCanvas,
      arguments: ["-iwad", wadPath],
      preRun: [function (module) {
        module.FS.writeFile(wadPath, bytes);
      }],
      print: (text) => console.log(`[DOOM] ${text}`),
      printErr: (text) => console.error(`[DOOM] ${text}`),
      onAbort: (reason) => {
        state.gameStarted = false;
        launchButton.disabled = false;
        setStatus(`Doom could not start: ${reason}`);
      },
    });
  } catch (error) {
    launchButton.disabled = false;
    launchButton.textContent = "Play selected IWAD";
    setStatus(error.message);
  }
}

launchButton.addEventListener("click", startGame);
document.getElementById("exitGameBtn").addEventListener("click", () => window.location.reload());
loadHostedWads();
