import { detailEndpoint, fetchJson, normalizeVehicle, unwrapCollection, unwrapDetail } from "./api.js";

const LIST_INTERVAL = 60_000;
const DETAIL_INTERVAL = 10_000;
const elements = Object.fromEntries(["vehicles", "vehicle-count", "summary", "message", "connection-label", "status-dot", "clock", "refresh", "last-update"].map((id) => [id, document.getElementById(id)]));
const state = { vehicles: new Map(), loading: false, detailLoading: false };

function lineColor(line) {
  const colors = ["#ffca0a", "#39b8ff", "#f47531", "#92d13d", "#e9559a", "#ad8cff"];
  return colors[[...String(line)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
}

function setConnection(mode, text) {
  elements["connection-label"].textContent = text;
  elements["status-dot"].className = `status-dot ${mode}`.trim();
}

function render() {
  const vehicles = [...state.vehicles.values()].sort((a, b) => a.line.localeCompare(b.line, "de", { numeric: true }));
  elements.vehicles.replaceChildren();
  for (const vehicle of vehicles) {
    const row = document.getElementById("vehicle-template").content.firstElementChild.cloneNode(true);
    row.querySelector(".line-badge").textContent = vehicle.line;
    row.querySelector(".line-badge").style.setProperty("--line-color", lineColor(vehicle.line));
    row.querySelector(".vehicle-number").textContent = vehicle.vehicleNumber;
    row.querySelector(".stop strong").textContent = vehicle.nextStop;
    row.querySelector(".destination").textContent = vehicle.destination;
    elements.vehicles.append(row);
  }
  if (!vehicles.length) {
    const empty = document.createElement("div");
    empty.className = "empty-row";
    empty.textContent = "Die SWU meldet aktuell keine aktiven Fahrzeuge.";
    elements.vehicles.append(empty);
  }
  elements["vehicle-count"].textContent = vehicles.length;
  elements.summary.textContent = `${vehicles.length} ${vehicles.length === 1 ? "Fahrzeug ist" : "Fahrzeuge sind"} derzeit im Liniennetz aktiv.`;
  elements.vehicles.setAttribute("aria-busy", "false");
}

async function refreshList() {
  if (state.loading) return;
  state.loading = true;
  elements.refresh.classList.add("busy");
  setConnection("loading", "SWU wird abgefragt …");
  try {
    const rawVehicles = unwrapCollection(await fetchJson("/api/trips"));
    if (!Array.isArray(rawVehicles)) throw new Error("Unerwartetes Datenformat");
    const activeIds = new Set();
    for (const raw of rawVehicles) {
      const candidate = normalizeVehicle(raw);
      activeIds.add(candidate.tripId);
      state.vehicles.set(candidate.tripId, normalizeVehicle(raw, state.vehicles.get(candidate.tripId)));
    }
    for (const id of state.vehicles.keys()) if (!activeIds.has(id)) state.vehicles.delete(id);
    hideError();
    render();
    markUpdated();
    setConnection("", "Live verbunden");
    refreshDetails();
  } catch (error) {
    showError(`Fahrzeugliste konnte nicht geladen werden: ${error.message}`);
  } finally {
    state.loading = false;
    elements.refresh.classList.remove("busy");
  }
}

async function refreshDetails() {
  if (state.detailLoading || !state.vehicles.size) return;
  state.detailLoading = true;
  const vehicles = [...state.vehicles.values()];
  try {
    const results = await Promise.allSettled(vehicles.map(async (vehicle) => normalizeVehicle(unwrapDetail(await fetchJson(detailEndpoint(vehicle))), vehicle)));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") state.vehicles.set(vehicles[index].tripId, result.value);
    });
    if (results.some((result) => result.status === "fulfilled")) {
      render();
      markUpdated();
    }
  } finally {
    state.detailLoading = false;
  }
}

function markUpdated() {
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  elements["last-update"].textContent = `Stand: ${time}`;
}

function showError(message) {
  setConnection("offline", "Keine Verbindung");
  elements.message.replaceChildren(document.createTextNode(message));
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Erneut versuchen";
  retry.addEventListener("click", refreshList);
  elements.message.append(retry);
  elements.message.hidden = false;
  elements.vehicles.replaceChildren();
  elements.vehicles.setAttribute("aria-busy", "false");
}

function hideError() { elements.message.hidden = true; }

setInterval(() => { elements.clock.textContent = new Date().toLocaleTimeString("de-DE"); }, 1_000);
elements.refresh.addEventListener("click", refreshList);
refreshList();
setInterval(refreshList, LIST_INTERVAL);
setInterval(refreshDetails, DETAIL_INTERVAL);
