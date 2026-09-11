export const TRIPS_ENDPOINT = "https://api.swu.de/mobility/v1/vehicle/trip/Trip";

const first = (object, keys, fallback = null) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], object);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

export function unwrapCollection(payload) {
  if (Array.isArray(payload)) return payload;
  return first(payload, ["vehicles", "trips", "Trip", "items", "data", "results", "value"], []);
}

export function unwrapDetail(payload) {
  return first(payload, ["vehicle", "trip", "Trip", "data", "result"], payload);
}

export function normalizeVehicle(raw, previous = {}) {
  const tripId = first(raw, ["tripId", "tripID", "id", "TripId", "trip.id"], previous.tripId);
  const vehicleNumber = first(raw, ["vehicleNumber", "vehicleNo", "vehicleId", "vehicle.id", "VehicleNumber", "callName"], previous.vehicleNumber ?? tripId);
  const line = first(raw, ["lineNumber", "line.number", "line.name", "line", "routeShortName", "publishedLineName", "LineNumber"], previous.line ?? "–");
  const nextStop = first(raw, ["nextStop.name", "nextStopName", "nextStation.name", "onwardCalls.0.stop.name", "stops.0.name", "NextStop"], previous.nextStop ?? "Wird ermittelt …");
  const destination = first(raw, ["destination.name", "destination", "headsign", "direction", "tripDestination", "Destination"], previous.destination ?? "Unbekannt");
  const latitude = Number(first(raw, ["position.latitude", "position.lat", "location.latitude", "latitude", "lat", "Latitude"], previous.latitude));
  const longitude = Number(first(raw, ["position.longitude", "position.lon", "position.lng", "location.longitude", "longitude", "lon", "lng", "Longitude"], previous.longitude));
  const links = raw?._links ?? {};
  const detailUrl = first(raw, ["detailUrl", "href", "_links.self.href", "links.self"], previous.detailUrl);

  return {
    ...previous,
    raw,
    tripId: String(tripId ?? vehicleNumber ?? crypto.randomUUID()),
    vehicleNumber: String(vehicleNumber ?? "–"),
    line: String(line),
    nextStop: String(nextStop),
    destination: typeof destination === "object" ? String(destination.name ?? destination.label ?? "Unbekannt") : String(destination),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    detailUrl: detailUrl ?? links.trip?.href ?? null,
  };
}

export function detailEndpoint(vehicle) {
  if (vehicle.detailUrl) return new URL(vehicle.detailUrl, TRIPS_ENDPOINT).href;
  return `${TRIPS_ENDPOINT}/${encodeURIComponent(vehicle.tripId)}`;
}

export async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
