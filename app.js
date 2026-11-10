const manifestUrl = new URL("./wad-library.json", window.location.href);
const state = { selected: null, hostedWads: [], localWad: null };
const grid = document.getElementById("libraryGrid");
const count = document.getElementById("libraryCount");
const selectedName = document.getElementById("selectedName");
const launchButton = document.getElementById("launchBtn");
const statusMessage = document.getElementById("statusMessage");
const wadInput = document.getElementById("wadInput");

function selectWad(wad) {
  state.selected = wad;
  selectedName.textContent = wad.name;
  launchButton.disabled = false;
  statusMessage.textContent = wad.source === "local"
    ? "Local IWAD selected. It is available for this browser session only."
    : "Hosted IWAD selected.";
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
      source: "hosted",
    }));
    renderLibrary();
    if (!state.hostedWads.length) statusMessage.textContent = "Add IWAD entries to wad-library.json to populate this list.";
  } catch (error) {
    count.textContent = "Unavailable";
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Could not load the hosted WAD list. Check wad-library.json.";
    grid.replaceChildren(message);
    statusMessage.textContent = error.message;
  }
}

wadInput.addEventListener("change", () => {
  const file = wadInput.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".wad")) {
    statusMessage.textContent = "Please choose an IWAD with a .wad extension.";
    wadInput.value = "";
    return;
  }

  state.localWad = file;
  selectWad({ id: "local-iwad", name: file.name, file, source: "local" });
  wadInput.value = "";
});

launchButton.addEventListener("click", () => {
  if (!state.selected) return;
  // The repository does not yet include a Doom/WASM engine. Keep selection truthful
  // and expose the chosen hosted URL or local File for a future engine adapter.
  statusMessage.textContent = "IWAD selected. A browser Doom engine still needs to be connected to enable gameplay.";
});

loadHostedWads();
