import { TRIPS_ENDPOINT, detailEndpoint, fetchJson, normalizeVehicle, unwrapCollection, unwrapDetail } from "./api.js";

const LIST_INTERVAL = 60_000;
const DETAIL_INTERVAL = 10_000;
const ULM = [48.3984, 9.9916];
const elements = Object.fromEntries(["vehicles", "vehicle-count", "summary", "message", "connection-label", "status-dot", "clock", "refresh", "locate"].map((id) => [id, document.getElementById(id)]));
const state = { vehicles: new Map(), markers: new Map(), listTimer: null, detailTimer: null, map: null, firstFit: true, loading: false };

function initMap() {
  if (!window.L) return;
  state.map = L.map("map", { zoomControl: false, attributionControl: true }).setView(ULM, 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(state.map);
  L.control.zoom({ position: "bottomleft" }).addTo(state.map);
}

function lineColor(line) {
  const colors = ["#ffca0a", "#39b8ff", "#f47531", "#92d13d", "#e9559a", "#ad8cff"];
  return colors[[...String(line)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
}

function setConnection(ok, text) {
  elements["connection-label"].textContent = text;
  elements["status-dot"].classList.toggle("offline", !ok);
}

function render() {
  const vehicles = [...state.vehicles.values()].sort((a, b) => a.line.localeCompare(b.line, "de", { numeric: true }));
  elements.vehicles.replaceChildren();
  for (const vehicle of vehicles) {
    const card = document.getElementById("vehicle-template").content.firstElementChild.cloneNode(true);
    card.querySelector(".line-badge").textContent = vehicle.line;
    card.querySelector(".line-badge").style.setProperty("--line-color", lineColor(vehicle.line));
    card.querySelector(".vehicle-number").textContent = `Fahrzeug ${vehicle.vehicleNumber}`;
    card.querySelector(".next-stop span").textContent = vehicle.nextStop;
    card.querySelector(".destination strong").textContent = vehicle.destination;
    card.addEventListener("click", () => focusVehicle(vehicle));
    elements.vehicles.append(card);
    updateMarker(vehicle);
  }
  elements["vehicle-count"].textContent = vehicles.length;
  elements.summary.textContent = vehicles.length ? `${vehicles.length} Fahrzeuge sind aktuell im Liniennetz aktiv.` : "Aktuell wurden keine aktiven Fahrzeuge gemeldet.";
  elements.vehicles.setAttribute("aria-busy", "false");
}

function updateMarker(vehicle) {
  if (!state.map || vehicle.latitude === null || vehicle.longitude === null) return;
  const html = `<span style="--marker:${lineColor(vehicle.line)}">${escapeHtml(vehicle.line)}</span>`;
  let marker = state.markers.get(vehicle.tripId);
  if (!marker) {
    marker = L.marker([vehicle.latitude, vehicle.longitude], { icon: L.divIcon({ className: "vehicle-marker", html, iconSize: [38, 38], iconAnchor: [19, 19] }) }).addTo(state.map);
    state.markers.set(vehicle.tripId, marker);
  } else marker.setLatLng([vehicle.latitude, vehicle.longitude]).setIcon(L.divIcon({ className: "vehicle-marker", html, iconSize: [38, 38], iconAnchor: [19, 19] }));
  marker.bindTooltip(`Linie ${escapeHtml(vehicle.line)} · Fahrzeug ${escapeHtml(vehicle.vehicleNumber)}<br>${escapeHtml(vehicle.nextStop)} → ${escapeHtml(vehicle.destination)}`);
}

function focusVehicle(vehicle) {
  if (state.map && vehicle.latitude !== null) state.map.flyTo([vehicle.latitude, vehicle.longitude], 16);
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

async function refreshList() {
  if (state.loading) return;
  state.loading = true;
  elements.refresh.classList.add("spinning");
  try {
    const payload = await fetchJson(TRIPS_ENDPOINT);
    const rawVehicles = unwrapCollection(payload);
    if (!Array.isArray(rawVehicles)) throw new Error("Die API-Antwort enthält keine Fahrzeugliste.");
    const activeIds = new Set();
    for (const raw of rawVehicles) {
      const candidate = normalizeVehicle(raw);
      activeIds.add(candidate.tripId);
      state.vehicles.set(candidate.tripId, normalizeVehicle(raw, state.vehicles.get(candidate.tripId)));
    }
    for (const id of state.vehicles.keys()) if (!activeIds.has(id)) removeVehicle(id);
    setConnection(true, "Live verbunden");
    elements.message.hidden = true;
    render();
    await refreshDetails();
  } catch (error) {
    showError(`SWU API nicht erreichbar: ${error.message}`);
  } finally {
    state.loading = false;
    elements.refresh.classList.remove("spinning");
  }
}

async function refreshDetails() {
  const vehicles = [...state.vehicles.values()];
  if (!vehicles.length) return;
  const results = await Promise.allSettled(vehicles.map(async (vehicle) => normalizeVehicle(unwrapDetail(await fetchJson(detailEndpoint(vehicle))), vehicle)));
  let successful = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful += 1;
      state.vehicles.set(vehicles[index].tripId, result.value);
    }
  });
  if (successful) {
    setConnection(true, `Live · ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`);
    render();
    fitMarkersOnce();
  }
}

function removeVehicle(id) {
  state.vehicles.delete(id);
  state.markers.get(id)?.remove();
  state.markers.delete(id);
}

function fitMarkersOnce() {
  if (!state.map || !state.firstFit || !state.markers.size) return;
  state.map.fitBounds(L.featureGroup([...state.markers.values()]).getBounds().pad(0.18), { maxZoom: 15 });
  state.firstFit = false;
}

function showError(message) {
  setConnection(false, "Verbindung unterbrochen");
  elements.message.textContent = message;
  elements.message.hidden = false;
  elements.vehicles.setAttribute("aria-busy", "false");
}

function start() {
  initMap();
  refreshList();
  state.listTimer = setInterval(refreshList, LIST_INTERVAL);
  state.detailTimer = setInterval(refreshDetails, DETAIL_INTERVAL);
  setInterval(() => { elements.clock.textContent = new Date().toLocaleTimeString("de-DE"); }, 1000);
  elements.refresh.addEventListener("click", refreshList);
  elements.locate.addEventListener("click", () => state.map?.flyTo(ULM, 13));
}

start();
