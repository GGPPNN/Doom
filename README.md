const library = [
  {
    id: "doom2",
    title: "Doom II",
    type: "IWAD",
    mode: "Single-player",
    difficulty: "Ultra-Violence",
    summary: "The demon hordes of Hell return with heavier weapons, darker corridors, and a nasty streak of chaos.",
    badge: "ID Software",
    accent: "linear-gradient(135deg, #3e1d15 0%, #e34929 38%, #1d2328 100%)",
  },
  {
    id: "classic",
    title: "Classic Doom",
    type: "IWAD",
    mode: "Single-player",
    difficulty: "Hurt Me Plenty",
    summary: "A bare-knuckle run through the original iconic nightmare — dense, fast, and timeless.",
    badge: "Original",
    accent: "linear-gradient(135deg, #111827 0%, #7b2d2d 40%, #d97706 100%)",
  },
  {
    id: "custom",
    title: "Custom WAD",
    type: "MOD",
    mode: "Community",
    difficulty: "Nightmare",
    summary: "Launch your own WAD or community map set and turn the browser into a custom slaughterhouse.",
    badge: "User",
    accent: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 38%, #22c55e 100%)",
  },
];

const state = {
  selected: library[0],
  customEntries: [],
};

const elements = {
  libraryGrid: document.getElementById("libraryGrid"),
  libraryCount: document.getElementById("libraryCount"),
  gameTitle: document.getElementById("gameTitle"),
  gameSummary: document.getElementById("gameSummary"),
  gameType: document.getElementById("gameType"),
  gameMode: document.getElementById("gameMode"),
  gameDifficulty: document.getElementById("gameDifficulty"),
  coverArt: document.getElementById("coverArt"),
  coverBadge: document.getElementById("coverBadge"),
  terminalOutput: document.getElementById("terminalOutput"),
  launchState: document.getElementById("launchState"),
  wadInput: document.getElementById("wadInput"),
  searchInput: document.getElementById("searchInput"),
};

function renderLibrary() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const visible = [...library, ...state.customEntries].filter((game) => {
    if (!query) return true;
    return (
      game.title.toLowerCase().includes(query) ||
      game.summary.toLowerCase().includes(query) ||
      game.type.toLowerCase().includes(query)
    );
  });

  elements.libraryCount.textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;

  elements.libraryGrid.innerHTML = visible
    .map(
      (game) => `
        <article class="game-card ${state.selected.id === game.id ? "active" : ""}" data-id="${game.id}">
          <div class="game-card-cover" style="background: ${game.accent};"></div>
          <div class="game-card-body">
            <div class="game-card-header">
              <h4>${game.title}</h4>
              <span class="game-card-badge">${game.badge}</span>
            </div>
            <p>${game.summary}</p>
          </div>
        </article>
      `
    )
    .join("");

  elements.libraryGrid.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const target = [...library, ...state.customEntries].find((game) => game.id === id);
      if (!target) return;
      state.selected = target;
      renderLibrary();
      renderSelectedGame();
    });
  });
}

function renderSelectedGame() {
  const game = state.selected;

  elements.gameTitle.textContent = game.title;
  elements.gameSummary.textContent = game.summary;
  elements.gameType.textContent = game.type;
  elements.gameMode.textContent = game.mode;
  elements.gameDifficulty.textContent = game.difficulty;
  elements.coverArt.style.background = game.accent;
  elements.coverBadge.textContent = game.badge;
}

function pushTerminalLine(text, type = "") {
  const row = document.createElement("div");
  row.className = `terminal-line ${type}`.trim();
  row.textContent = `> ${text}`;
  elements.terminalOutput.appendChild(row);
  elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

function launchGame() {
  const game = state.selected;
  elements.launchState.textContent = "Launching";
  pushTerminalLine(`Booting ${game.title}...`);
  pushTerminalLine("Checking engine state...", "system");
  pushTerminalLine("Scanning WAD payloads...", "system");

  window.setTimeout(() => {
    pushTerminalLine(`Ready: ${game.title} loaded and primed for action.`);
    elements.launchState.textContent = "Ready";
  }, 900);
}

function handleWadUpload(event) {
  const [file] = event.target.files;
  if (!file) return;

  const customId = `custom-${Date.now()}`;
  const customGame = {
    id: customId,
    title: file.name.replace(/\.[^/.]+$/, "") || "Custom WAD",
    type: file.name.toLowerCase().endsWith(".pk3") ? "PK3" : "WAD",
    mode: "Custom",
    difficulty: "Hell on Earth",
    summary: `User-selected ${file.name} loaded into the browser launcher for custom combat and modded mayhem.`,
    badge: "Local",
    accent: "linear-gradient(135deg, #111827 0%, #0ea5e9 38%, #22c55e 100%)",
  };

  state.customEntries.unshift(customGame);
  state.selected = customGame;
  renderLibrary();
  renderSelectedGame();
  pushTerminalLine(`Imported custom payload: ${file.name}`);
  elements.wadInput.value = "";
}

function bindEvents() {
  document.getElementById("launchBtn").addEventListener("click", launchGame);
  document.getElementById("launchMainBtn").addEventListener("click", launchGame);
  document.getElementById("addWadBtn").addEventListener("click", () => elements.wadInput.click());
  elements.wadInput.addEventListener("change", handleWadUpload);
  elements.searchInput.addEventListener("input", renderLibrary);

  const favoriteBtn = document.getElementById("favoriteBtn");
  favoriteBtn.addEventListener("click", () => {
    const toggled = favoriteBtn.classList.toggle("is-favorite");
    favoriteBtn.textContent = toggled ? "★ Favorited" : "☆ Favorite";
    pushTerminalLine(
      toggled ? `${state.selected.title} added to favorites.` : `${state.selected.title} removed from favorites.`
    );
  });
}

bindEvents();
renderLibrary();
renderSelectedGame();
