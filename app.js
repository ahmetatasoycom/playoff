
/* =========================================================
   PLAYOFF — GAME NIGHT CONTROL
   Complete Application JavaScript
========================================================= */

"use strict";

/* =========================================================
   STATE
========================================================= */

const state = {
  eventName: "Cuma Gecesi Kupası",
  game: "EA SPORTS FC",
  players: [],
  wheelPool: [],
  wheelOriginal: [],
  wheelSpinning: false,
  selectedPlayerId: null,
  assignments: {},
  tournamentSize: 4,
  bracket: { rounds: [], size: 4, display: "both" },
  selectedLeague: "premier-league",
  selectedTeams: [],

  standings: {
    method: null,
    selectedLeague: "premier-league",
    selectedPlayerId: null,
    pool: [],
    assignments: {},
    spinning: false,
    fixtures: [],
    completed: false,
  },
};

let teamPickerReturnView = "hubView";
let appInitialized = false;
let spinTimer = null;
let standingsSpinTimer = null;

/* =========================================================
   LEAGUES & TEAM CATALOG
========================================================= */

const leagues = {
  "premier-league": {
    name: "Premier League",
    country: "İngiltere",
    logo: "premier-league.png",
    teams: [
      ["Arsenal","arsenal"],["Aston Villa","aston-villa"],
      ["Bournemouth","bournemouth"],["Brentford","brentford"],
      ["Brighton","brighton"],["Burnley","burnley"],
      ["Chelsea","chelsea"],["Crystal Palace","crystal-palace"],
      ["Everton","everton"],["Fulham","fulham"],
      ["Leeds United","leeds-united"],["Liverpool","liverpool"],
      ["Manchester City","manchester-city"],
      ["Manchester United","manchester-united"],
      ["Newcastle United","newcastle-united"],
      ["Nottingham Forest","nottingham-forest"],
      ["Sunderland","sunderland"],["Tottenham","tottenham"],
      ["West Ham","west-ham"],["Wolves","wolves"],
    ],
  },

  "la-liga": {
    name: "La Liga",
    country: "İspanya",
    logo: "la-liga.png",
    teams: [
      ["Alaves","alaves"],["Athletic Bilbao","athletic-bilbao"],
      ["Atletico Madrid","atletico-madrid"],["Barcelona","barcelona"],
      ["Celta Vigo","celta-vigo"],["Elche","elche"],
      ["Espanyol","espanyol"],["Getafe","getafe"],
      ["Girona","girona"],["Levante","levante"],
      ["Mallorca","mallorca"],["Osasuna","osasuna"],
      ["Oviedo","oviedo"],["Rayo Vallecano","rayo-vallecano"],
      ["Real Betis","real-betis"],["Real Madrid","real-madrid"],
      ["Real Sociedad","real-sociedad"],["Sevilla","sevilla"],
      ["Valencia","valencia"],["Villarreal","villarreal"],
    ],
  },

  bundesliga: {
    name: "Bundesliga",
    country: "Almanya",
    logo: "bundesliga.png",
    teams: [
      ["Bayer Leverkusen","bayer-leverkusen"],
      ["Bayern Münih","bayern-munich"],
      ["Borussia Dortmund","borussia-dortmund"],
      ["Eintracht Frankfurt","eintracht-frankfurt"],
      ["Hamburger SV","hamburger-sv"],
      ["Hoffenheim","hoffenheim"],["Köln","koln"],
      ["RB Leipzig","rb-leipzig"],["Stuttgart","stuttgart"],
      ["Wolfsburg","wolfsburg"],
    ],
  },

  "serie-a": {
    name: "Serie A",
    country: "İtalya",
    logo: "serie-a.png",
    teams: [
      ["Atalanta","atalanta"],["Fiorentina","fiorentina"],
      ["Inter","inter"],["Juventus","juventus"],
      ["Lazio","lazio"],["AC Milan","ac-milan"],
      ["Napoli","napoli"],["Roma","roma"],
    ],
  },

  "ligue-1": {
    name: "Ligue 1",
    country: "Fransa",
    logo: "ligue-1.png",
    teams: [
      ["Lille","lille"],["Lyon","lyon"],
      ["Marseille","marseille"],["Monaco","monaco"],
      ["Paris Saint-Germain","paris-saint-germain"],
    ],
  },

  "super-lig": {
    name: "Süper Lig",
    country: "Türkiye",
    logo: "super-lig.png",
    teams: [
      ["Başakşehir","basaksehir"],["Trabzonspor","trabzonspor"],
      ["Beşiktaş","besiktas"],["Fenerbahçe","fenerbahce"],
      ["Galatasaray","galatasaray"],
    ],
  },
};

/* =========================================================
   TEAM IMAGES
========================================================= */

const teamImages = {};

Object.values(leagues).forEach(league => {
  league.teams.forEach(([name, file]) => {
    teamImages[name] = `${file}.png`;
  });
});

teamImages.Ajax = "ajax.png";
teamImages.PSV = "psv.png";
teamImages.Benfica = "benfica.png";
teamImages.Porto = "porto.png";

const leagueImages = Object.fromEntries(
  Object.entries(leagues).map(([id, league]) => [id, league.logo])
);

const defaultTeams = [
  "Arsenal","Chelsea","Liverpool","Manchester City",
  "Manchester United","Tottenham","Real Madrid","Barcelona",
  "Atletico Madrid","Bayern Münih","Borussia Dortmund","RB Leipzig",
  "Inter","Juventus","AC Milan","Napoli",
  "Paris Saint-Germain","Marseille","Fenerbahçe","Galatasaray",
  "Beşiktaş","Trabzonspor","Ajax","PSV","Benfica","Porto",
  "Newcastle United","Aston Villa","Bayer Leverkusen","Roma",
  "Monaco","Brighton",
];

/* =========================================================
   COLORS
========================================================= */

const playerColors = [
  "#1473f9","#e64e68","#18b8a5","#b16cf0",
  "#e39b36","#32a6d9","#dc6da8","#76b84e",
  "#ed7540","#7789ef","#d1a83e","#36a6a1",
  "#c65cdb","#6295d9","#df6670","#77ad60",
];

const wheelColors = [
  "#1767d5","#e34c68","#15a899","#7849b9",
  "#d18c31","#267fae","#bb568d","#568d4a",
  "#d35b36","#596cc5",
];

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = id => document.getElementById(id);

function bind(id, event, callback) {
  const element = $(id);

  if (!element) {
    console.warn(`PLAYOFF: "${id}" HTML elemanı bulunamadı.`);
    return null;
  }

  element.addEventListener(event, callback);
  return element;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function showView(viewId) {
  [
    "setupView",
    "hubView",
    "wheelEditor",
    "standingsMethodView",
    "standingsTeamView",
    "toolView",
    "standingsTool",
  ].forEach(id => {
    $(id)?.classList.add("hidden");
  });

  const target = $(viewId);

  if (target) {
    target.classList.remove("hidden");
  } else {
    console.warn(`PLAYOFF: "${viewId}" görünümü bulunamadı.`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showTool(toolName) {
  document.querySelectorAll(".tool-panel").forEach(panel => {
    panel.classList.add("hidden");
  });

  const tool = $(toolName + "Tool");

  if (!tool) {
    showToast("İstenen ekran bulunamadı: " + toolName);
    return;
  }

  tool.classList.remove("hidden");

  if ($("toolEventName")) {
    $("toolEventName").textContent = state.eventName;
  }

  showView("toolView");
}

function teamLogoHTML(teamName, className = "") {
  if (!teamName) return "";

  const imagePath = teamImages[teamName];

  return `
    <span class="team-logo-wrap ${className}">
      <img
        src="${imagePath || ""}"
        alt="${escapeHTML(teamName)}"
        ${imagePath ? "" : "hidden"}
        onerror="this.hidden=true;this.parentElement.classList.add('logo-missing')"
      >
      <span class="team-logo-placeholder" aria-hidden="true">
        <span></span>
      </span>
    </span>
  `;
}

function getWheelCanvas() {
  return $("wheelCanvas");
}

/* =========================================================
   PLAYER MANAGEMENT
========================================================= */

function addPlayer() {
  const input = $("playerInput");
  if (!input) return;

  const name = input.value.trim();

  if (!name) return showToast("Lütfen oyuncu adı gir.");

  if (state.players.length >= 16) {
    return showToast("En fazla 16 oyuncu ekleyebilirsin.");
  }

  if (state.players.some(player =>
    player.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr")
  )) {
    return showToast("Bu oyuncu zaten eklenmiş.");
  }

  state.players.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : "player-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    name,
    color: playerColors[state.players.length % playerColors.length],
  });

  input.value = "";
  renderPlayers();
  input.focus();
}

function removePlayer(id) {
  if (state.wheelSpinning || state.standings.spinning) {
    return showToast("İşlem devam ederken oyuncu silinemez.");
  }

  state.players = state.players.filter(player => player.id !== id);
  delete state.assignments[id];
  delete state.standings.assignments[id];

  if (state.selectedPlayerId === id) state.selectedPlayerId = null;
  if (state.standings.selectedPlayerId === id) {
    state.standings.selectedPlayerId = null;
  }

  renderPlayers();
}

function renderPlayers() {
  const container = $("playerChips");
  if (!container) return;

  if ($("playerCount")) {
    $("playerCount").textContent = state.players.length;
  }

  if (!state.players.length) {
    container.innerHTML = `
      <div class="empty-players">
        İsimleri ekledikçe burada görünecekler.
      </div>
    `;
    return;
  }

  container.innerHTML = state.players.map(player => `
    <div class="player-chip">
      <span class="roster-avatar"
        style="background:${player.color};width:24px;height:24px;font-size:9px">
        ${escapeHTML(player.name.charAt(0).toLocaleUpperCase("tr"))}
      </span>
      <span>${escapeHTML(player.name)}</span>
      <button type="button" data-remove-player="${player.id}"
        aria-label="Oyuncuyu sil">×</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-remove-player]").forEach(button => {
    button.addEventListener("click", () => {
      removePlayer(button.dataset.removePlayer);
    });
  });
}

function renderRoster() {
  if ($("rosterCount")) {
    $("rosterCount").textContent = state.players.length + " oyuncu";
  }

  const avatars = $("rosterAvatars");
  if (!avatars) return;

  avatars.innerHTML = state.players.map(player => `
    <div class="roster-avatar" title="${escapeHTML(player.name)}"
      style="background:${player.color}">
      ${escapeHTML(player.name.charAt(0).toLocaleUpperCase("tr"))}
    </div>
  `).join("");
}

/* =========================================================
   EVENT SETUP
========================================================= */

function startEvent() {
  if (state.players.length < 2) {
    if ($("setupError")) {
      $("setupError").textContent =
        "Etkinliği başlatmak için en az 2 oyuncu eklemelisin.";
    }
    return;
  }

  const selectedSize = Number($("tournamentSize")?.value);

  if (![4, 8, 16].includes(selectedSize)) {
    if ($("setupError")) {
      $("setupError").textContent = "Geçerli bir turnuva büyüklüğü seç.";
    }
    return;
  }

  if (state.players.length > selectedSize) {
    if ($("setupError")) {
      $("setupError").textContent =
        "Oyuncu sayısı turnuva takım sayısından fazla olamaz.";
    }
    return;
  }

  state.tournamentSize = selectedSize;
  state.eventName = $("eventName")?.value.trim() || "Yeni Etkinlik";
  state.game = $("gameSelect")?.value || "EA SPORTS FC";

  if ($("setupError")) $("setupError").textContent = "";

  if ($("headerEventName")) {
    $("headerEventName").textContent = state.eventName;
  }

  if ($("hubTitle")) {
    $("hubTitle").textContent = state.eventName.toLocaleUpperCase("tr");
  }

  if ($("hubSubtitle")) {
    $("hubSubtitle").textContent =
      `${state.game} · ${state.players.length} OYUNCU · ${state.tournamentSize} TAKIM`;
  }

  if ($("toolEventName")) {
    $("toolEventName").textContent = state.eventName;
  }

  if ($("standingsEventName")) {
    $("standingsEventName").textContent = state.eventName;
  }

  if ($("standingsToolEventName")) {
    $("standingsToolEventName").textContent = state.eventName;
  }

  state.assignments = {};
  state.players.forEach(player => {
    state.assignments[player.id] = [];
  });

  state.selectedPlayerId = null;
  state.selectedTeams = [];
  state.wheelOriginal = [];
  state.wheelPool = [];
  state.wheelSpinning = false;

  resetStandingsState();

  state.bracket.rounds = [];
  state.bracket.size = state.tournamentSize;
  state.bracket.display = "both";

  resetChampionSection();

  if ($("lastResult")) $("lastResult").textContent = "—";

  if ($("spinStatus")) {
    $("spinStatus").textContent =
      "Takım kurasına başlamak için bir oyuncu seç.";
  }

  renderRoster();
  renderDrawPlayers();
  renderSelectedPlayer();
  renderWheelPool();
  drawWheel();
  updateSpinControls();

  renderLeagueList();
  renderSelectedLeague();
  renderTeamGrid();
  renderSelectedTeamList();
  updateTeamPickerSummary();

  showView("hubView");
}

function backToSetup() {
  if ($("eventName")) $("eventName").value = state.eventName;
  if ($("gameSelect")) $("gameSelect").value = state.game;
  if ($("tournamentSize")) {
    $("tournamentSize").value = String(state.tournamentSize);
  }

  renderPlayers();
  showView("setupView");
}

/* =========================================================
   NORMAL WHEEL MODE
========================================================= */

function openWheel() {
  state.selectedTeams = [];
  openWheelEditor("hubView");
}

function openReadyWheel() {
  if (state.wheelSpinning) {
    return showToast("Çark şu anda dönüyor.");
  }

  state.selectedTeams = [...defaultTeams];
  state.wheelOriginal = [...defaultTeams];
  state.wheelPool = [...defaultTeams];

  state.assignments = {};
  state.players.forEach(player => {
    state.assignments[player.id] = [];
  });

  state.selectedPlayerId = null;
  state.bracket.rounds = [];
  state.bracket.size = state.tournamentSize;

  resetChampionSection();
  resetWheelRotation();

  if ($("lastResult")) $("lastResult").textContent = "—";

  drawWheel();
  renderWheelPool();
  renderDrawPlayers();
  renderSelectedPlayer();
  updateSpinControls();

  showTool("wheel");
  showToast("Hazır çark oluşturuldu!");
}

function openWheelEditor(returnView = "hubView") {
  if (state.wheelSpinning || state.standings.spinning) {
    return showToast("Çark dönerken liste düzenlenemez.");
  }

  if (!$("wheelEditor")) {
    return showToast("Takım seçim ekranı bulunamadı.");
  }

  teamPickerReturnView = returnView;

  if ($("selectionEventName")) {
    $("selectionEventName").textContent = state.eventName;
  }

  renderLeagueList();
  renderSelectedLeague();
  renderTeamGrid();
  renderSelectedTeamList();
  updateTeamPickerSummary();

  showView("wheelEditor");
}

function resetWheelRotation() {
  const canvas = getWheelCanvas();
  if (!canvas) return;

  canvas.style.transition = "none";
  canvas.style.transform = "rotate(0deg)";
}

/* =========================================================
   TEAM PICKER — NORMAL WHEEL
========================================================= */

function renderLeagueList() {
  const container = $("leagueList");
  if (!container) return;

  container.innerHTML = Object.entries(leagues).map(([id, league]) => {
    const selected = state.selectedLeague === id;

    const selectedCount = league.teams.filter(([name]) =>
      state.selectedTeams.includes(name)
    ).length;

    return `
      <button type="button"
        class="league-card ${selected ? "active selected" : ""}"
        data-league-id="${id}">
        <span class="league-card-logo">
          <img src="${league.logo}" alt="${escapeHTML(league.name)}"
            onerror="this.hidden=true">
        </span>
        <span class="league-card-info">
          <strong>${escapeHTML(league.name)}</strong>
          <small>${escapeHTML(league.country)}</small>
        </span>
        <span class="league-card-count">${selectedCount}</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-league-id]").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedLeague = button.dataset.leagueId;
      renderLeagueList();
      renderSelectedLeague();
      renderTeamGrid();
    });
  });
}

function renderSelectedLeague() {
  const league = leagues[state.selectedLeague];
  if (!league) return;

  if ($("selectedLeagueName")) {
    $("selectedLeagueName").textContent = league.name;
  }

  if ($("selectedLeagueCountry")) {
    $("selectedLeagueCountry").textContent = league.country;
  }

  if ($("leagueTeamCount")) {
    $("leagueTeamCount").textContent = league.teams.length + " KULÜP";
  }

  if ($("selectedLeagueDescription")) {
    $("selectedLeagueDescription").textContent =
      league.country + " ligindeki kulüpler arasından seçim yap.";
  }

  const logo = $("selectedLeagueLogoImage");

  if (logo) {
    logo.onerror = () => { logo.hidden = true; };
    logo.src = league.logo;
    logo.alt = league.name;
    logo.hidden = false;
  }
}

function renderTeamGrid() {
  const container = $("teamGrid");
  if (!container) return;

  const league = leagues[state.selectedLeague];
  if (!league) return;

  const search = ($("teamSearchInput")?.value || "")
    .trim().toLocaleLowerCase("tr");

  const filtered = league.teams.filter(([name]) =>
    name.toLocaleLowerCase("tr").includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = `
      <div class="team-grid-empty">Aramana uygun kulüp bulunamadı.</div>
    `;
    return;
  }

  container.innerHTML = filtered.map(([name]) => {
    const selected = state.selectedTeams.includes(name);

    return `
      <button type="button"
        class="team-card ${selected ? "selected active" : ""}"
        data-team-name="${escapeHTML(name)}"
        aria-pressed="${selected}">
        <span class="team-card-logo">${teamLogoHTML(name)}</span>
        <span class="team-card-name">${escapeHTML(name)}</span>
        <span class="team-card-check">${selected ? "✓" : "+"}</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-team-name]").forEach(button => {
    button.addEventListener("click", () => {
      toggleSelectedTeam(button.dataset.teamName);
    });
  });
}

function toggleSelectedTeam(teamName) {
  if (state.selectedTeams.includes(teamName)) {
    state.selectedTeams = state.selectedTeams.filter(team => team !== teamName);
  } else {
    state.selectedTeams.push(teamName);
  }

  renderLeagueList();
  renderTeamGrid();
  renderSelectedTeamList();
  updateTeamPickerSummary();
}

function renderSelectedTeamList() {
  const container = $("selectedTeamList");
  if (!container) return;

  if (!state.selectedTeams.length) {
    container.innerHTML = `
      <div class="selected-team-empty">Henüz takım seçmedin.</div>
    `;
    return;
  }

  container.innerHTML = state.selectedTeams.map(name => `
    <div class="selected-team-card">
      ${teamLogoHTML(name)}
      <span>${escapeHTML(name)}</span>
      <button type="button" data-remove-team="${escapeHTML(name)}"
        aria-label="${escapeHTML(name)} takımını kaldır">×</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-remove-team]").forEach(button => {
    button.addEventListener("click", () => {
      const name = button.dataset.removeTeam;
      state.selectedTeams = state.selectedTeams.filter(team => team !== name);
      renderLeagueList();
      renderTeamGrid();
      renderSelectedTeamList();
      updateTeamPickerSummary();
    });
  });
}

function clearSelectedTeams() {
  state.selectedTeams = [];
  renderLeagueList();
  renderTeamGrid();
  renderSelectedTeamList();
  updateTeamPickerSummary();
}

function getTeamPickerRequirement() {
  return teamPickerReturnView === "standingsTeamView"
    ? state.players.length
    : state.tournamentSize;
}

function updateTeamPickerSummary() {
  const count = state.selectedTeams.length;
  const required = getTeamPickerRequirement();

  if ($("selectedTeamCount")) {
    $("selectedTeamCount").textContent = count;
  }

  if ($("teamPickerSummary")) {
    $("teamPickerSummary").textContent =
      count >= required ? "TAKIM HAVUZUN HAZIR" : "TAKIM SEÇİMİ DEVAM EDİYOR";
  }

  if ($("teamSelectionRequirement")) {
    $("teamSelectionRequirement").textContent =
      count >= required
        ? required + " oyuncu için yeterli takım seçtin."
        : "Devam etmek için en az " + required +
          " takım seçmelisin. (" + count + "/" + required + ")";
  }

  if ($("applySelectedTeams")) {
    $("applySelectedTeams").disabled = count < required;
  }
}

/* =========================================================
   APPLY TEAM SELECTION
========================================================= */

function applySelectedTeams() {
  if (state.wheelSpinning || state.standings.spinning) {
    return showToast("Çark dönerken takım havuzu değiştirilemez.");
  }

  const uniqueTeams = [...new Set(state.selectedTeams)];
  const required = getTeamPickerRequirement();

  if (uniqueTeams.length < required) {
    return showToast("En az " + required + " farklı takım seçmelisin.");
  }

  // Puan durumu özel çark havuzu
  if (teamPickerReturnView === "standingsTeamView") {
    state.standings.method = "custom-wheel";
    state.standings.pool = [...uniqueTeams];
    state.standings.assignments = {};
    state.players.forEach(player => {
      state.standings.assignments[player.id] = null;
    });

    state.standings.selectedPlayerId = null;
    state.standings.spinning = false;

    $("standingsWheelArea")?.classList.remove("hidden");
    renderStandingsAssignment();
    renderStandingsTeamPicker();
    renderStandingsWheel();
    updateStandingsAssignmentSummary();

    showView("standingsTeamView");
    showToast("Özel takım havuzu hazır!");
    return;
  }

  if (getTotalAssignedTeams() > 0) {
    const confirmed = confirm(
      "Takım havuzunu değiştirirsen mevcut takım atamaları sıfırlanacak. Devam edilsin mi?"
    );
    if (!confirmed) return;
  }

  state.selectedTeams = uniqueTeams;
  state.wheelOriginal = [...uniqueTeams];
  state.wheelPool = [...uniqueTeams];

  state.assignments = {};
  state.players.forEach(player => {
    state.assignments[player.id] = [];
  });

  state.selectedPlayerId = null;
  state.wheelSpinning = false;
  state.bracket.rounds = [];
  state.bracket.size = state.tournamentSize;

  resetChampionSection();
  resetWheelRotation();

  if ($("lastResult")) $("lastResult").textContent = "—";

  drawWheel();
  renderWheelPool();
  renderDrawPlayers();
  renderSelectedPlayer();
  updateSpinControls();

  showTool("wheel");
  showToast("Takım havuzu güncellendi!");
}

/* =========================================================
   NORMAL WHEEL ASSIGNMENT
========================================================= */

function getPlayerQuota(player) {
  const index = state.players.findIndex(item => item.id === player.id);
  if (index < 0 || !state.players.length) return 0;

  const base = Math.floor(state.tournamentSize / state.players.length);
  const remainder = state.tournamentSize % state.players.length;

  return base + (index < remainder ? 1 : 0);
}

function getPlayerAssignedCount(player) {
  return (state.assignments[player.id] || []).length;
}

function getPlayerRemainingQuota(player) {
  return Math.max(0, getPlayerQuota(player) - getPlayerAssignedCount(player));
}

function isPlayerAssignmentComplete(player) {
  return getPlayerRemainingQuota(player) === 0;
}

function getTotalAssignedTeams() {
  return Object.values(state.assignments).reduce((total, teams) =>
    total + (Array.isArray(teams) ? teams.length : 0), 0
  );
}

function areAllTeamsAssigned() {
  return state.players.length >= 2 &&
    getTotalAssignedTeams() === state.tournamentSize &&
    state.players.every(player => isPlayerAssignmentComplete(player));
}

function renderDrawPlayers() {
  const container = $("drawPlayerList");
  const assignmentContainer = $("playerTeamAssignments");

  if (!container || !assignmentContainer) return;

  if (!state.players.length) {
    container.innerHTML = "";
    assignmentContainer.innerHTML = "";
    return;
  }

  container.innerHTML = state.players.map(player => {
    const assigned = getPlayerAssignedCount(player);
    const quota = getPlayerQuota(player);
    const complete = isPlayerAssignmentComplete(player);
    const selected = state.selectedPlayerId === player.id;

    return `
      <button type="button"
        class="draw-player-chip ${selected ? "selected" : ""} ${complete ? "assigned" : ""}"
        data-player-id="${player.id}" ${complete ? "disabled" : ""}>
        ${escapeHTML(player.name)}
        <span>${assigned}/${quota}</span>
        ${complete ? " ✓" : ""}
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-player-id]").forEach(button => {
    button.addEventListener("click", () => selectDrawPlayer(button.dataset.playerId));
  });

  assignmentContainer.innerHTML = state.players.map(player => {
    const teams = state.assignments[player.id] || [];
    const quota = getPlayerQuota(player);
    const complete = isPlayerAssignmentComplete(player);

    return `
      <div class="assignment-player ${complete ? "assignment-complete" : ""}">
        <div class="assignment-player-header">
          <div class="assignment-player-name">
            <span class="roster-avatar"
              style="background:${player.color};width:25px;height:25px;font-size:9px">
              ${escapeHTML(player.name.charAt(0).toLocaleUpperCase("tr"))}
            </span>
            ${escapeHTML(player.name)}
          </div>
          <span class="assignment-progress">
            ${teams.length}/${quota} TAKIM ${complete ? "✓" : ""}
          </span>
        </div>
        <div class="assignment-teams">
          ${
            teams.length
              ? teams.map(team => `
                <div class="assignment-team">
                  ${teamLogoHTML(team)}
                  <span>${escapeHTML(team)}</span>
                </div>
              `).join("")
              : `<span class="assignment-empty">Henüz takım çekilmedi.</span>`
          }
        </div>
      </div>
    `;
  }).join("");
}

function renderSelectedPlayer() {
  const info = $("selectedPlayerInfo");
  if (!info) return;

  const player = state.players.find(item => item.id === state.selectedPlayerId);

  if (!player) {
    info.innerHTML = areAllTeamsAssigned()
      ? `<span style="color:var(--green)">Tüm takımlar dağıtıldı!</span>
         <small>Turnuva ağacını oluşturmaya hazırsın.</small>`
      : `Oyuncu seçilmedi.<small>Takım çekmek için sıradaki oyuncuyu seç.</small>`;
    return;
  }

  info.innerHTML = `
    ${escapeHTML(player.name)}
    <small>${getPlayerAssignedCount(player)}/${getPlayerQuota(player)} takım belirlendi ·
    ${getPlayerRemainingQuota(player)} takım daha çekmeli.</small>
  `;
}

function selectDrawPlayer(playerId) {
  const player = state.players.find(item => item.id === playerId);
  if (!player) return;

  if (state.wheelSpinning) {
    return showToast("Çark dönerken oyuncu değiştiremezsin.");
  }

  if (isPlayerAssignmentComplete(player)) {
    return showToast("Bu oyuncunun takım kotası tamamlandı.");
  }

  const current = state.players.find(item => item.id === state.selectedPlayerId);

  if (current && current.id !== playerId && !isPlayerAssignmentComplete(current)) {
    return showToast(current.name + " henüz takım kotasını tamamlamadı.");
  }

  state.selectedPlayerId = playerId;
  renderDrawPlayers();
  renderSelectedPlayer();
  updateSpinControls();
}

/* =========================================================
   NORMAL WHEEL DRAWING
========================================================= */

function drawWheel() {
  const canvas = getWheelCanvas();
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const items = state.wheelPool;

  ctx.clearRect(0, 0, size, size);

  if (!items.length) {
    ctx.fillStyle = "#142c4d";
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 23px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAKIM YOK", center, center);
    return;
  }

  const angle = Math.PI * 2 / items.length;

  items.forEach((item, index) => {
    const start = index * angle - Math.PI / 2;
    const end = start + angle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = wheelColors[index % wheelColors.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + angle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";

    const fontSize = items.length > 20 ? 14 : items.length > 12 ? 16 : 19;
    ctx.font = `bold ${fontSize}px sans-serif`;

    let label = item;
    if (label.length > 18) label = label.substring(0, 16) + "...";

    ctx.shadowColor = "rgba(0,0,0,.3)";
    ctx.shadowBlur = 3;
    ctx.fillText(label, radius - 25, 0);
    ctx.restore();
  });
}

function renderWheelPool() {
  if ($("poolCount")) $("poolCount").textContent = state.wheelPool.length;
  if ($("poolTitle")) $("poolTitle").textContent = "Takımlar";

  const container = $("poolList");
  if (!container) return;

  if (!state.wheelPool.length) {
    container.innerHTML = `<div class="pool-empty">Takım havuzu boş.</div>`;
    return;
  }

  container.innerHTML = state.wheelPool.map((team, index) => `
    <div class="pool-item">
      <span class="pool-item-index">${String(index + 1).padStart(2, "0")}</span>
      ${teamLogoHTML(team)}
      <span>${escapeHTML(team)}</span>
    </div>
  `).join("");
}

function updateSpinControls() {
  const player = state.players.find(item => item.id === state.selectedPlayerId);
  const allAssigned = areAllTeamsAssigned();
  const button = $("spinBtn");

  if (button) {
    button.disabled = state.wheelSpinning ||
      !player ||
      state.wheelPool.length === 0 ||
      (player && isPlayerAssignmentComplete(player));
  }

  $("goToTournament")?.classList.toggle("hidden", !allAssigned);

  if ($("spinStatus")) {
    if (state.wheelSpinning) {
      $("spinStatus").textContent = "Çark dönüyor...";
    } else if (allAssigned) {
      $("spinStatus").textContent = "Bütün takımlar dağıtıldı. Turnuva başlayabilir!";
    } else if (!state.wheelPool.length) {
      $("spinStatus").textContent = "Takım havuzu boş. Takım listesini düzenleyebilirsin.";
    } else if (!player) {
      $("spinStatus").textContent = "Takım çekmek için sıradaki oyuncuyu seç.";
    }
  }
}

function spinWheel() {
  if (state.wheelSpinning) return;

  const player = state.players.find(item => item.id === state.selectedPlayerId);

  if (!player) return showToast("Önce bir oyuncu seçmelisin.");
  if (isPlayerAssignmentComplete(player)) {
    return showToast("Bu oyuncunun takım kotası tamamlandı.");
  }
  if (!state.wheelPool.length) return showToast("Takım havuzu boş.");

  const canvas = getWheelCanvas();
  if (!canvas) return showToast("Çark alanı bulunamadı.");

  state.wheelSpinning = true;
  if ($("spinBtn")) $("spinBtn").disabled = true;
  if ($("spinStatus")) $("spinStatus").textContent = "Çark dönüyor...";

  const index = Math.floor(Math.random() * state.wheelPool.length);
  const rotations = 5 + Math.floor(Math.random() * 4);
  const segment = 360 / state.wheelPool.length;
  const angle = 360 - (index * segment + segment / 2);
  const rotation = rotations * 360 + angle;

  canvas.style.transition = "transform 4s cubic-bezier(.12, .75, .15, 1)";
  canvas.style.transform = `rotate(${rotation}deg)`;

  clearTimeout(spinTimer);
  spinTimer = setTimeout(() => finishSpin(index), 4100);
}

function finishSpin(index) {
  if (!state.wheelSpinning) return;

  const team = state.wheelPool[index];
  const player = state.players.find(item => item.id === state.selectedPlayerId);

  if (!team || !player) {
    state.wheelSpinning = false;
    updateSpinControls();
    return;
  }

  if (!Array.isArray(state.assignments[player.id])) {
    state.assignments[player.id] = [];
  }

  state.assignments[player.id].push(team);
  state.wheelPool.splice(index, 1);

  if ($("lastResult")) {
    $("lastResult").innerHTML = `
      <div class="last-result-assignment">
        <strong>${escapeHTML(player.name)}</strong>
        <span>→</span>
        ${teamLogoHTML(team)}
        <strong>${escapeHTML(team)}</strong>
      </div>
    `;
  }

  const remaining = getPlayerRemainingQuota(player);

  if (remaining === 0) {
    if ($("spinStatus")) {
      $("spinStatus").textContent = player.name + " takım kotasını tamamladı!";
    }
    state.selectedPlayerId = null;
  } else if ($("spinStatus")) {
    $("spinStatus").textContent =
      player.name + " bir takım daha çekebilir. Kalan: " + remaining;
  }

  state.wheelSpinning = false;
  resetWheelRotation();
  drawWheel();
  renderWheelPool();
  renderDrawPlayers();
  renderSelectedPlayer();
  updateSpinControls();

  showToast(player.name + " → " + team);
}

function restoreWheelPool() {
  if (state.wheelSpinning) {
    return showToast("Çark dönerken sıfırlama yapamazsın.");
  }

  if (getTotalAssignedTeams() > 0 && !confirm(
    "Bütün takım atamaları silinecek ve kura baştan başlayacak. Devam edilsin mi?"
  )) return;

  state.players.forEach(player => {
    state.assignments[player.id] = [];
  });

  resetChampionSection();
  state.wheelPool = [...state.wheelOriginal];
  state.selectedPlayerId = null;
  resetWheelRotation();

  if ($("lastResult")) $("lastResult").textContent = "—";

  drawWheel();
  renderWheelPool();
  renderDrawPlayers();
  renderSelectedPlayer();
  updateSpinControls();

  showToast("Kura sıfırlandı.");
}

/* =========================================================
   KNOCKOUT TOURNAMENT
========================================================= */

function goToTournament() {
  if (!areAllTeamsAssigned()) {
    return showToast("Önce bütün takımlar dağıtılmalı.");
  }

  generateBracket();
  showTool("tournament");
}

function generateBracket() {
  if (!areAllTeamsAssigned()) {
    return showToast("Takım dağıtımı henüz tamamlanmadı.");
  }

  const size = state.tournamentSize;
  state.bracket.size = size;

  const participants = state.players.flatMap(player =>
    (state.assignments[player.id] || []).map((team, index) => ({
      id: player.id + "-" + index,
      player: player.name,
      team,
      color: player.color,
    }))
  );

  if (participants.length !== size) {
    return showToast("Katılımcı sayısı turnuva büyüklüğüyle eşleşmiyor.");
  }

  const shuffled = [...participants];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const roundCount = Math.log2(size);
  const rounds = [];

  for (let r = 0; r < roundCount; r++) {
    const count = size / Math.pow(2, r + 1);
    rounds.push(Array.from({ length: count }, () => ({
      a: null, b: null, winner: null,
    })));
  }

  rounds[0].forEach((match, index) => {
    match.a = shuffled[index * 2];
    match.b = shuffled[index * 2 + 1];
  });

  state.bracket.rounds = rounds;

  if ($("bracketCaption")) {
    $("bracketCaption").textContent =
      size + " takımlı · " + state.players.length + " oyunculu eleme ağacı";
  }

  renderBracket();
  showToast("Turnuva ağacı hazır!");
}

function propagateBracket() {
  const rounds = state.bracket.rounds;

  for (let r = 1; r < rounds.length; r++) {
    const previous = rounds[r - 1];

    rounds[r].forEach((match, index) => {
      const oldWinner = match.winner;
      match.a = previous[index * 2]?.winner || null;
      match.b = previous[index * 2 + 1]?.winner || null;

      const stillExists = oldWinner &&
        ((match.a && match.a.id === oldWinner.id) ||
         (match.b && match.b.id === oldWinner.id));

      match.winner = stillExists ? oldWinner : null;
    });
  }
}

function selectWinner(roundIndex, matchIndex, side) {
  const match = state.bracket.rounds[roundIndex]?.[matchIndex];
  if (!match) return;

  const selected = side === "a" ? match.a : match.b;
  if (!selected) return;

  if (!match.a || !match.b) {
    return showToast("Rakibin de belirlenmesini beklemelisin.");
  }

  if (match.winner?.id === selected.id) return;

  if (match.winner && !confirm(
    "Bu maçın kazananını değiştirmek istiyor musun? Sonraki tur sonuçları etkilenebilir."
  )) return;

  match.winner = selected;
  propagateBracket();
  renderBracket();

  const champion = getChampion();

  showToast(champion
    ? "ŞAMPİYON: " + champion.player + " / " + champion.team
    : selected.team + " bir üst tura yükseldi."
  );
}

const roundNames = {
  4: ["YARI FİNAL", "FİNAL"],
  8: ["ÇEYREK FİNAL", "YARI FİNAL", "FİNAL"],
  16: ["SON 16", "ÇEYREK FİNAL", "YARI FİNAL", "FİNAL"],
};

function renderBracket() {
  const board = $("bracketBoard");
  const rounds = state.bracket.rounds;
  const size = state.bracket.size;

  if (!board || !rounds.length) return;

  board.innerHTML = "";
  const names = roundNames[size] || [];

  rounds.forEach((round, r) => {
    const roundElement = document.createElement("div");
    roundElement.className = "bracket-round";

    const heading = document.createElement("div");
    heading.className = "round-heading";
    heading.textContent = names[r] || "TUR " + (r + 1);

    const matchesElement = document.createElement("div");
    matchesElement.className = "round-matches";

    round.forEach((match, m) => {
      const matchElement = document.createElement("div");
      matchElement.className = "bracket-match";
      if (match.winner) matchElement.classList.add("completed");
      if (r === rounds.length - 1) matchElement.classList.add("champion-match");

      const number = document.createElement("div");
      number.className = "match-number";
      number.innerHTML = `
        <span>MAÇ ${m + 1}</span>
        <span class="match-status">${match.winner ? "TAMAMLANDI" : "BEKLİYOR"}</span>
      `;

      matchElement.appendChild(number);
      matchElement.appendChild(createMatchSlot(match, "a", r, m));
      matchElement.appendChild(createMatchSlot(match, "b", r, m));
      matchesElement.appendChild(matchElement);
    });

    roundElement.appendChild(heading);
    roundElement.appendChild(matchesElement);
    board.appendChild(roundElement);
  });

  renderChampionSection();
}

function createMatchSlot(match, side, roundIndex, matchIndex) {
  const participant = match[side];
  const button = document.createElement("button");
  button.type = "button";
  button.className = "match-slot";

  if (!participant) {
    button.disabled = true;
    button.innerHTML = `<span class="slot-seed">—</span><span class="slot-name">Bekleniyor</span>`;
    return button;
  }

  const winner = match.winner?.id === participant.id;
  const loser = match.winner && match.winner.id !== participant.id;

  if (winner) button.classList.add("winner");
  if (loser) button.classList.add("loser");

  const display = state.bracket.display;
  const showTeam = display !== "player";
  const mainText = display === "team" ? participant.team : participant.player;

  button.innerHTML = `
    <span class="slot-seed" style="color:${participant.color || "#7e95b3"}">●</span>
    <span class="slot-content">
      ${showTeam ? teamLogoHTML(participant.team, "match-team-logo") : ""}
      <span class="slot-text">
        <span class="slot-name">${escapeHTML(mainText)}</span>
        ${display === "both" && participant.team
          ? `<span class="slot-team">${escapeHTML(participant.team)}</span>` : ""}
      </span>
    </span>
    ${winner ? '<span class="slot-check">✓</span>' : ""}
  `;

  button.addEventListener("click", () => {
    selectWinner(roundIndex, matchIndex, side);
  });

  button.title = participant.player + (participant.team ? " / " + participant.team : "");
  return button;
}

function getChampion() {
  const rounds = state.bracket.rounds;
  if (!rounds.length) return null;
  return rounds[rounds.length - 1][0]?.winner || null;
}

function renderChampionSection() {
  const section = $("championSection");
  if (!section) return;

  const champion = getChampion();

  if (!champion) {
    section.classList.add("hidden");
    return;
  }

  if ($("championPlayer")) $("championPlayer").textContent = champion.player;
  if ($("championTeamName")) $("championTeamName").textContent = champion.team || "";

  const image = $("championTeamLogo");

  if (image) {
    image.onerror = () => { image.hidden = true; };
    image.src = teamImages[champion.team] || "";
    image.alt = champion.team || "";
    image.hidden = !teamImages[champion.team];
  }

  section.classList.remove("hidden");
}

function resetChampionSection() {
  $("championSection")?.classList.add("hidden");

  if ($("championPlayer")) $("championPlayer").textContent = "ŞAMPİYON";
  if ($("championTeamName")) $("championTeamName").textContent = "";

  if ($("championTeamLogo")) {
    $("championTeamLogo").src = "";
    $("championTeamLogo").hidden = true;
  }
}

function setBracketDisplay(display) {
  if (!["player", "team", "both"].includes(display)) return;

  state.bracket.display = display;

  document.querySelectorAll(".view-switch").forEach(button => {
    button.classList.toggle("active", button.dataset.display === display);
  });

  renderBracket();
}

/* =========================================================
   STANDINGS MODE — RESET & ENTRY
========================================================= */

function resetStandingsState() {
  clearTimeout(standingsSpinTimer);

  state.standings = {
    method: null,
    selectedLeague: "premier-league",
    selectedPlayerId: null,
    pool: [],
    assignments: {},
    spinning: false,
    fixtures: [],
    completed: false,
  };

  if ($("standingsWheelArea")) {
    $("standingsWheelArea").classList.add("hidden");
  }

  if ($("standingsChampionSection")) {
    $("standingsChampionSection").classList.add("hidden");
  }
}

function openStandingsMode() {
  if (state.players.length < 2) {
    return showToast("Puan durumu için en az 2 oyuncu gerekli.");
  }

  resetStandingsState();

  state.players.forEach(player => {
    state.standings.assignments[player.id] = null;
  });

  if ($("standingsEventName")) {
    $("standingsEventName").textContent = state.eventName;
  }

  if ($("standingsPlayerCount")) {
    $("standingsPlayerCount").textContent = state.players.length + " oyuncu";
  }

  if ($("standingsPlayerAvatars")) {
    $("standingsPlayerAvatars").innerHTML = state.players.map(player => `
      <div class="roster-avatar" title="${escapeHTML(player.name)}"
        style="background:${player.color}">
        ${escapeHTML(player.name.charAt(0).toLocaleUpperCase("tr"))}
      </div>
    `).join("");
  }

  showView("standingsMethodView");
}

function backToStandingsMethods() {
  if (state.standings.spinning) {
    return showToast("Çark dönerken geri dönemezsin.");
  }

  showView("standingsMethodView");
}

function startStandingsAssignment(method) {
  if (state.players.length < 2) {
    return showToast("Puan durumu için en az 2 oyuncu gerekli.");
  }

  state.standings.method = method;
  state.standings.selectedPlayerId = null;
  state.standings.pool = [];
  state.standings.fixtures = [];
  state.standings.completed = false;
  state.standings.assignments = {};

  state.players.forEach(player => {
    state.standings.assignments[player.id] = null;
  });

  if (method === "ready-wheel") {
    state.standings.pool = [...defaultTeams];
    $("standingsWheelArea")?.classList.remove("hidden");
  } else if (method === "custom-wheel") {
    state.selectedTeams = [];
    openWheelEditor("standingsTeamView");
    return;
  } else {
    $("standingsWheelArea")?.classList.add("hidden");
  }

  renderStandingsAssignment();
  renderStandingsTeamPicker();
  renderStandingsWheel();
  updateStandingsAssignmentSummary();

  showView("standingsTeamView");
}

/* =========================================================
   STANDINGS MODE — PLAYER ASSIGNMENT
========================================================= */

function getStandingsAssignedCount() {
  return state.players.filter(player =>
    Boolean(state.standings.assignments[player.id])
  ).length;
}

function getStandingsRemainingPlayers() {
  return state.players.filter(player =>
    !state.standings.assignments[player.id]
  );
}

function renderStandingsAssignment() {
  const container = $("standingsAssignmentPlayers");
  if (!container) return;

  container.innerHTML = state.players.map(player => {
    const team = state.standings.assignments[player.id];
    const selected = state.standings.selectedPlayerId === player.id;

    return `
      <button type="button"
        class="draw-player-chip standings-player-chip ${selected ? "selected" : ""} ${team ? "assigned" : ""}"
        data-standings-player="${player.id}"
        ${team ? "disabled" : ""}>
        <span class="roster-avatar"
          style="background:${player.color};width:25px;height:25px;font-size:9px">
          ${escapeHTML(player.name.charAt(0).toLocaleUpperCase("tr"))}
        </span>
        <span>${escapeHTML(player.name)}</span>
        <span>${team ? "✓" : "TAKIM SEÇ"}</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-standings-player]").forEach(button => {
    button.addEventListener("click", () => {
      selectStandingsPlayer(button.dataset.standingsPlayer);
    });
  });

  if ($("standingsAssignmentProgress")) {
    $("standingsAssignmentProgress").textContent =
      getStandingsAssignedCount() + " / " + state.players.length;
  }

  renderStandingsAssignedTeams();
}

function selectStandingsPlayer(playerId) {
  if (state.standings.spinning) {
    return showToast("Çark dönerken oyuncu değiştirilemez.");
  }

  if (state.standings.assignments[playerId]) {
    return showToast("Bu oyuncuya zaten takım atanmış.");
  }

  state.standings.selectedPlayerId = playerId;

  const player = state.players.find(item => item.id === playerId);

  if ($("standingsCurrentPlayer")) {
    $("standingsCurrentPlayer").innerHTML = player
      ? `<strong>${escapeHTML(player.name)}</strong> için takım belirleniyor.`
      : "Takım belirlemek için bir oyuncu seç.";
  }

  renderStandingsAssignment();
  updateStandingsAssignmentSummary();

  if (state.standings.method === "ready-wheel" ||
      state.standings.method === "custom-wheel") {
    updateStandingsSpinControls();
  } else {
    renderStandingsTeamPicker();
  }
}

function renderStandingsAssignedTeams() {
  const container = $("standingsAssignedTeams");
  if (!container) return;

  const assigned = state.players.filter(player =>
    state.standings.assignments[player.id]
  );

  if (!assigned.length) {
    container.innerHTML = `
      <div class="selected-empty">Henüz hiçbir oyuncuya takım atanmadı.</div>
    `;
    return;
  }

  container.innerHTML = assigned.map(player => {
    const team = state.standings.assignments[player.id];

    return `
      <div class="selected-team-card standings-assigned-card">
        ${teamLogoHTML(team)}
        <span>
          <strong>${escapeHTML(player.name)}</strong>
          <small>${escapeHTML(team)}</small>
        </span>
      </div>
    `;
  }).join("");
}

function updateStandingsAssignmentSummary() {
  const assigned = getStandingsAssignedCount();
  const total = state.players.length;
  const complete = assigned === total;

  if ($("standingsAssignedCount")) {
    $("standingsAssignedCount").textContent = assigned;
  }

  if ($("standingsAssignmentSummary")) {
    $("standingsAssignmentSummary").textContent =
      complete ? "LİG KADRON HAZIR" : "LİG KADRON HAZIR DEĞİL";
  }

  if ($("standingsAssignmentRequirement")) {
    $("standingsAssignmentRequirement").textContent = complete
      ? "Bütün oyuncuların takımı belirlendi. Fikstürü oluşturabilirsin."
      : "Devam etmek için bütün oyunculara takım atanmalı. (" +
        assigned + "/" + total + ")";
  }

  if ($("createStandingsBtn")) {
    $("createStandingsBtn").disabled = !complete;
  }

  if ($("standingsAvailableTeamCount")) {
    $("standingsAvailableTeamCount").textContent =
      state.standings.method === "manual"
        ? "TAKIM SEÇ"
        : state.standings.pool.length;
  }

  renderStandingsAssignedTeams();
}

/* =========================================================
   STANDINGS MODE — MANUAL TEAM PICKER
========================================================= */

function renderStandingsTeamPicker() {
  const leagueContainer = $("standingsLeagueList");
  const teamContainer = $("standingsTeamGrid");

  if (!leagueContainer || !teamContainer) return;

  if (state.standings.method !== "manual") {
    leagueContainer.classList.add("hidden");
    teamContainer.classList.add("hidden");
    return;
  }

  leagueContainer.classList.remove("hidden");
  teamContainer.classList.remove("hidden");

  leagueContainer.innerHTML = Object.entries(leagues).map(([id, league]) => `
    <button type="button"
      class="league-card ${state.standings.selectedLeague === id ? "active selected" : ""}"
      data-standings-league="${id}">
      <span class="league-card-logo">
        <img src="${league.logo}" alt="${escapeHTML(league.name)}"
          onerror="this.hidden=true">
      </span>
      <span class="league-card-info">
        <strong>${escapeHTML(league.name)}</strong>
        <small>${escapeHTML(league.country)}</small>
      </span>
    </button>
  `).join("");

  leagueContainer.querySelectorAll("[data-standings-league]").forEach(button => {
    button.addEventListener("click", () => {
      state.standings.selectedLeague = button.dataset.standingsLeague;
      renderStandingsTeamPicker();
    });
  });

  const league = leagues[state.standings.selectedLeague];

  if (!league) {
    teamContainer.innerHTML = "";
    return;
  }

  const usedTeams = new Set(
    Object.values(state.standings.assignments).filter(Boolean)
  );

  const currentPlayer = state.players.find(player =>
    player.id === state.standings.selectedPlayerId
  );

  if ($("standingsPickerTitle")) {
    $("standingsPickerTitle").textContent = currentPlayer
      ? currentPlayer.name + " İÇİN TAKIM SEÇ"
      : "ÖNCE OYUNCU SEÇ";
  }

  teamContainer.innerHTML = league.teams.map(([name]) => {
    const used = usedTeams.has(name);

    return `
      <button type="button"
        class="team-card ${used ? "selected active" : ""}"
        data-standings-team="${escapeHTML(name)}"
        ${used || !currentPlayer ? "disabled" : ""}>
        <span class="team-card-logo">${teamLogoHTML(name)}</span>
        <span class="team-card-name">${escapeHTML(name)}</span>
        <span class="team-card-check">${used ? "✓" : "+"}</span>
      </button>
    `;
  }).join("");

  teamContainer.querySelectorAll("[data-standings-team]").forEach(button => {
    button.addEventListener("click", () => {
      assignStandingsTeam(button.dataset.standingsTeam);
    });
  });
}

function assignStandingsTeam(teamName) {
  const playerId = state.standings.selectedPlayerId;

  if (!playerId) {
    return showToast("Önce takım atayacağın oyuncuyu seç.");
  }

  if (Object.values(state.standings.assignments).includes(teamName)) {
    return showToast("Bu takım başka bir oyuncuya atanmış.");
  }

  state.standings.assignments[playerId] = teamName;
  state.standings.selectedPlayerId = null;

  if ($("standingsCurrentPlayer")) {
    $("standingsCurrentPlayer").textContent =
      "Takım belirlemek için sıradaki oyuncuyu seç.";
  }

  renderStandingsAssignment();
  renderStandingsTeamPicker();
  updateStandingsAssignmentSummary();

  showToast(teamName + " takımı atandı!");
}

/* =========================================================
   STANDINGS MODE — WHEEL
========================================================= */

function renderStandingsWheel() {
  const canvas = $("standingsWheelCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const items = state.standings.pool;

  ctx.clearRect(0, 0, size, size);

  if (!items.length) {
    ctx.fillStyle = "#142c4d";
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAKIM YOK", center, center);
    return;
  }

  const angle = Math.PI * 2 / items.length;

  items.forEach((team, index) => {
    const start = index * angle - Math.PI / 2;
    const end = start + angle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = wheelColors[index % wheelColors.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + angle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${items.length > 20 ? 14 : 18}px sans-serif`;

    let label = team;
    if (label.length > 18) label = label.slice(0, 16) + "...";

    ctx.fillText(label, radius - 25, 0);
    ctx.restore();
  });

  updateStandingsSpinControls();
}

function updateStandingsSpinControls() {
  const button = $("standingsSpinBtn");
  const selectedPlayer = state.standings.selectedPlayerId;
  const pool = state.standings.pool;

  if (button) {
    button.disabled =
      state.standings.spinning ||
      !selectedPlayer ||
      !pool.length ||
      getStandingsAssignedCount() >= state.players.length;
  }

  if ($("standingsSpinStatus")) {
    if (state.standings.spinning) {
      $("standingsSpinStatus").textContent = "Çark dönüyor...";
    } else if (getStandingsAssignedCount() === state.players.length) {
      $("standingsSpinStatus").textContent = "Bütün takımlar dağıtıldı!";
    } else if (!selectedPlayer) {
      $("standingsSpinStatus").textContent = "Bir oyuncu seçerek çarkı döndür.";
    } else if (!pool.length) {
      $("standingsSpinStatus").textContent = "Takım havuzu boş.";
    } else {
      const player = state.players.find(item => item.id === selectedPlayer);
      $("standingsSpinStatus").textContent =
        player.name + " için takım belirlemeye hazırsın.";
    }
  }
}

function spinStandingsWheel() {
  if (state.standings.spinning) return;

  const playerId = state.standings.selectedPlayerId;

  if (!playerId) {
    return showToast("Önce takım atayacağın oyuncuyu seç.");
  }

  if (!state.standings.pool.length) {
    return showToast("Takım havuzu boş.");
  }

  const canvas = $("standingsWheelCanvas");
  if (!canvas) return showToast("Puan durumu çarkı bulunamadı.");

  state.standings.spinning = true;

  if ($("standingsSpinBtn")) $("standingsSpinBtn").disabled = true;
  if ($("standingsSpinStatus")) {
    $("standingsSpinStatus").textContent = "Çark dönüyor...";
  }

  const index = Math.floor(Math.random() * state.standings.pool.length);
  const rotations = 5 + Math.floor(Math.random() * 4);
  const segment = 360 / state.standings.pool.length;
  const selectedAngle = 360 - (index * segment + segment / 2);
  const rotation = rotations * 360 + selectedAngle;

  canvas.style.transition = "transform 4s cubic-bezier(.12, .75, .15, 1)";
  canvas.style.transform = `rotate(${rotation}deg)`;

  clearTimeout(standingsSpinTimer);

  standingsSpinTimer = setTimeout(() => {
    finishStandingsSpin(index);
  }, 4100);
}

function finishStandingsSpin(index) {
  if (!state.standings.spinning) return;

  const team = state.standings.pool[index];
  const playerId = state.standings.selectedPlayerId;
  const player = state.players.find(item => item.id === playerId);

  if (!team || !player) {
    state.standings.spinning = false;
    updateStandingsSpinControls();
    return;
  }

  state.standings.assignments[playerId] = team;
  state.standings.pool.splice(index, 1);
  state.standings.selectedPlayerId = null;
  state.standings.spinning = false;

  const canvas = $("standingsWheelCanvas");

  if (canvas) {
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
  }

  if ($("standingsCurrentPlayer")) {
    $("standingsCurrentPlayer").innerHTML =
      `<strong>${escapeHTML(player.name)}</strong> → ${teamLogoHTML(team)} ${escapeHTML(team)}`;
  }

  if ($("standingsSpinStatus")) {
    $("standingsSpinStatus").textContent =
      player.name + " için " + team + " belirlendi.";
  }

  renderStandingsWheel();
  renderStandingsAssignment();
  updateStandingsAssignmentSummary();

  showToast(player.name + " → " + team);
}

/* =========================================================
   STANDINGS MODE — FIXTURE GENERATION
========================================================= */

function createStandingsFixtures() {
  const assignments = state.standings.assignments;

  const participants = state.players.map(player => ({
    id: player.id,
    name: player.name,
    color: player.color,
    team: assignments[player.id],
  }));

  if (participants.some(player => !player.team)) {
    return showToast("Bütün oyunculara takım atanmalı.");
  }

  const fixtures = [];
  let matchNumber = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      fixtures.push({
        id: "fixture-" + matchNumber++,
        home: participants[i],
        away: participants[j],
        homeGoals: null,
        awayGoals: null,
        played: false,
      });
    }
  }

  state.standings.fixtures = fixtures;
  state.standings.completed = false;

  if ($("standingsToolEventName")) {
    $("standingsToolEventName").textContent = state.eventName;
  }

  renderStandingsTool();
  showView("standingsTool");

  showToast("Lig fikstürü oluşturuldu!");
}

/* =========================================================
   STANDINGS MODE — TABLE CALCULATIONS
========================================================= */

function calculateStandings() {
  const rows = state.players.map(player => ({
    id: player.id,
    name: player.name,
    team: state.standings.assignments[player.id],
    color: player.color,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  const byId = Object.fromEntries(rows.map(row => [row.id, row]));

  state.standings.fixtures.forEach(match => {
    if (!match.played) return;

    const home = byId[match.home.id];
    const away = byId[match.away.id];

    if (!home || !away) return;

    const hg = Number(match.homeGoals);
    const ag = Number(match.awayGoals);

    home.played++;
    away.played++;

    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (hg < ag) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points++;
      away.points++;
    }
  });

  rows.forEach(row => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  });

  rows.sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.name.localeCompare(b.name, "tr")
  );

  return rows;
}

/* =========================================================
   STANDINGS MODE — TABLE RENDER
========================================================= */

function renderStandingsTable() {
  const tbody = $("standingsTableBody");
  if (!tbody) return;

  const rows = calculateStandings();

  tbody.innerHTML = rows.map((row, index) => `
    <tr class="${index === 0 && row.played > 0 ? "table-leader" : ""}">
      <td>${index + 1}</td>
      <td>
        <div class="standings-player-cell">
          <span class="roster-avatar"
            style="background:${row.color};width:27px;height:27px;font-size:10px">
            ${escapeHTML(row.name.charAt(0).toLocaleUpperCase("tr"))}
          </span>
          <span class="standings-player-info">
            <strong>${escapeHTML(row.name)}</strong>
            <small>${teamLogoHTML(row.team)} ${escapeHTML(row.team || "")}</small>
          </span>
        </div>
      </td>
      <td>${row.played}</td>
      <td>${row.wins}</td>
      <td>${row.draws}</td>
      <td>${row.losses}</td>
      <td>${row.goalDifference > 0 ? "+" : ""}${row.goalDifference}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("");

  renderStandingsChampion();
}

/* =========================================================
   STANDINGS MODE — FIXTURE RENDER
========================================================= */

function renderStandingsFixtures() {
  const container = $("standingsFixtures");
  if (!container) return;

  const fixtures = state.standings.fixtures;

  if (!fixtures.length) {
    container.innerHTML = `
      <div class="bracket-placeholder">Henüz fikstür oluşturulmadı.</div>
    `;
    return;
  }

  container.innerHTML = fixtures.map((match, index) => `
    <div class="standings-fixture ${match.played ? "completed" : ""}"
      data-fixture-id="${match.id}">

      <div class="standings-fixture-number">
        MAÇ ${index + 1}
        <span>${match.played ? "TAMAMLANDI" : "BEKLİYOR"}</span>
      </div>

      <div class="standings-fixture-content">

        <div class="standings-fixture-player home">
          ${teamLogoHTML(match.home.team)}
          <span>
            <strong>${escapeHTML(match.home.name)}</strong>
            <small>${escapeHTML(match.home.team)}</small>
          </span>
        </div>

        <div class="standings-score-inputs">
          <input
            type="number"
            min="0"
            max="99"
            inputmode="numeric"
            aria-label="${escapeHTML(match.home.name)} gol"
            data-home-score="${match.id}"
            value="${match.homeGoals ?? ""}"
            placeholder="0"
          >
          <span>:</span>
          <input
            type="number"
            min="0"
            max="99"
            inputmode="numeric"
            aria-label="${escapeHTML(match.away.name)} gol"
            data-away-score="${match.id}"
            value="${match.awayGoals ?? ""}"
            placeholder="0"
          >
        </div>

        <div class="standings-fixture-player away">
          <span>
            <strong>${escapeHTML(match.away.name)}</strong>
            <small>${escapeHTML(match.away.team)}</small>
          </span>
          ${teamLogoHTML(match.away.team)}
        </div>

      </div>

      <div class="standings-fixture-actions">
        <button type="button"
          class="primary-btn"
          data-save-fixture="${match.id}">
          ${match.played ? "SKORU GÜNCELLE" : "SONUCU KAYDET"}
        </button>
        ${
          match.played
            ? `<button type="button" class="ghost-btn"
                data-clear-fixture="${match.id}">SİL</button>`
            : ""
        }
      </div>

    </div>
  `).join("");

  container.querySelectorAll("[data-save-fixture]").forEach(button => {
    button.addEventListener("click", () => {
      saveFixtureResult(button.dataset.saveFixture);
    });
  });

  container.querySelectorAll("[data-clear-fixture]").forEach(button => {
    button.addEventListener("click", () => {
      clearFixtureResult(button.dataset.clearFixture);
    });
  });
}

/* =========================================================
   STANDINGS MODE — SAVE / CLEAR RESULTS
========================================================= */

function saveFixtureResult(fixtureId) {
  const match = state.standings.fixtures.find(item => item.id === fixtureId);
  if (!match) return;

  const homeInput = document.querySelector(`[data-home-score="${fixtureId}"]`);
  const awayInput = document.querySelector(`[data-away-score="${fixtureId}"]`);

  if (!homeInput || !awayInput) return;

  const homeValue = homeInput.value.trim();
  const awayValue = awayInput.value.trim();

  if (homeValue === "" || awayValue === "") {
    return showToast("İki takımın da skorunu girmelisin.");
  }

  const homeGoals = Number(homeValue);
  const awayGoals = Number(awayValue);

  if (
    !Number.isInteger(homeGoals) ||
    !Number.isInteger(awayGoals) ||
    homeGoals < 0 ||
    awayGoals < 0 ||
    homeGoals > 99 ||
    awayGoals > 99
  ) {
    return showToast("Geçerli bir maç skoru gir.");
  }

  match.homeGoals = homeGoals;
  match.awayGoals = awayGoals;
  match.played = true;

  renderStandingsTool();
  showToast("Maç sonucu kaydedildi!");
}

function clearFixtureResult(fixtureId) {
  const match = state.standings.fixtures.find(item => item.id === fixtureId);
  if (!match) return;

  match.homeGoals = null;
  match.awayGoals = null;
  match.played = false;

  renderStandingsTool();
  showToast("Maç sonucu silindi.");
}

/* =========================================================
   STANDINGS MODE — CHAMPION
========================================================= */

function renderStandingsChampion() {
  const section = $("standingsChampionSection");
  if (!section) return;

  const fixtures = state.standings.fixtures;
  const completed = fixtures.length > 0 && fixtures.every(match => match.played);

  state.standings.completed = completed;

  if (!completed) {
    section.classList.add("hidden");
    return;
  }

  const rows = calculateStandings();
  const first = rows[0];
  const second = rows[1];

  if (!first) {
    section.classList.add("hidden");
    return;
  }

  const tied =
    second &&
    first.points === second.points &&
    first.goalDifference === second.goalDifference &&
    first.goalsFor === second.goalsFor;

  if (tied) {
    section.classList.add("hidden");
    showToast("Lig eşitlikle tamamlandı! İlk iki oyuncu aynı istatistiklere sahip.");
    return;
  }

  if ($("standingsChampionPlayer")) {
    $("standingsChampionPlayer").textContent = first.name;
  }

  if ($("standingsChampionTeamName")) {
    $("standingsChampionTeamName").textContent = first.team;
  }

  const image = $("standingsChampionTeamLogo");

  if (image) {
    image.onerror = () => { image.hidden = true; };
    image.src = teamImages[first.team] || "";
    image.alt = first.team || "";
    image.hidden = !teamImages[first.team];
  }

  section.classList.remove("hidden");
}

/* =========================================================
   STANDINGS MODE — OVERVIEW
========================================================= */

function renderStandingsOverview() {
  const total = state.standings.fixtures.length;
  const completed = state.standings.fixtures.filter(match => match.played).length;

  if ($("standingsOverviewPlayers")) {
    $("standingsOverviewPlayers").textContent = state.players.length + " oyuncu";
  }

  if ($("standingsOverviewMatches")) {
    $("standingsOverviewMatches").textContent = total + " maç";
  }

  if ($("standingsOverviewCompleted")) {
    $("standingsOverviewCompleted").textContent = completed + " / " + total;
  }

  if ($("standingsFixtureCount")) {
    $("standingsFixtureCount").textContent = total + " MAÇ";
  }
}

function renderStandingsTool() {
  renderStandingsOverview();
  renderStandingsTable();
  renderStandingsFixtures();
}

/* =========================================================
   STANDINGS MODE — NAVIGATION
========================================================= */

function backToStandingsTeams() {
  if (state.standings.spinning) {
    return showToast("Çark dönerken geri dönemezsin.");
  }

  renderStandingsAssignment();
  renderStandingsTeamPicker();
  updateStandingsAssignmentSummary();

  showView("standingsTeamView");
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {
  // Kurulum
  bind("addPlayerBtn", "click", addPlayer);

  bind("playerInput", "keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addPlayer();
    }
  });

  bind("startBtn", "click", startEvent);
  bind("backToSetup", "click", backToSetup);
  bind("editRosterBtn", "click", backToSetup);

  bind("eventName", "input", () => {
    if ($("headerEventName")) {
      $("headerEventName").textContent =
        $("eventName").value || "YENİ ETKİNLİK";
    }
  });

  // Ana menü
  bind("backToHub", "click", () => showView("hubView"));

  // Normal çark modları
  bind("createWheelMode", "click", event => {
    event.preventDefault();
    openWheel();
  });

  bind("readyWheelMode", "click", event => {
    event.preventDefault();
    openReadyWheel();
  });

  bind("editWheelBtn", "click", () => openWheelEditor("toolView"));

  // Takım seçim ekranı
  bind("closeWheelEditor", "click", event => {
    event.preventDefault();
    showView(teamPickerReturnView);
  });

  bind("teamSearchInput", "input", renderTeamGrid);
  bind("clearSelectedTeams", "click", clearSelectedTeams);
  bind("applySelectedTeams", "click", applySelectedTeams);

  // Normal çark
  bind("spinBtn", "click", spinWheel);
  bind("restorePoolBtn", "click", restoreWheelPool);
  bind("goToTournament", "click", goToTournament);

  // Eleme turnuvası görünüm seçenekleri
  document.querySelectorAll(".view-switch").forEach(button => {
    button.addEventListener("click", () => {
      setBracketDisplay(button.dataset.display);
    });
  });

  // PUAN DURUMU — ANA MOD
  bind("standingsMode", "click", openStandingsMode);

  // Puan durumu — yöntem ekranı
  bind("standingsBackToHub", "click", () => showView("hubView"));

  bind("standingsCustomWheelBtn", "click", () => {
    startStandingsAssignment("custom-wheel");
  });

  bind("standingsReadyWheelBtn", "click", () => {
    startStandingsAssignment("ready-wheel");
  });

  bind("standingsManualTeamsBtn", "click", () => {
    startStandingsAssignment("manual");
  });

  // Puan durumu — takım atama ekranı
  bind("standingsBackToMethods", "click", backToStandingsMethods);
  bind("standingsSpinBtn", "click", spinStandingsWheel);
  bind("createStandingsBtn", "click", createStandingsFixtures);

  // Puan durumu — fikstür ekranı
  bind("standingsBackToTeams", "click", backToStandingsTeams);
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initializeApp() {
  if (appInitialized) return;
  appInitialized = true;

  setupEventListeners();

  renderPlayers();

  state.selectedTeams = [];
  state.wheelOriginal = [];
  state.wheelPool = [];

  renderLeagueList();
  renderSelectedLeague();
  renderTeamGrid();
  renderSelectedTeamList();
  updateTeamPickerSummary();

  drawWheel();
  updateSpinControls();

  console.log("PLAYOFF: Uygulama başarıyla başlatıldı.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, {
    once: true,
  });
} else {
  initializeApp();
}
