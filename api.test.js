import test from "node:test";
import assert from "node:assert/strict";
import { detailEndpoint, normalizeVehicle, unwrapCollection, unwrapDetail } from "./api.js";
import { upstreamUrl } from "./server.js";

test("unwraps common API collection envelopes", () => {
  assert.deepEqual(unwrapCollection({ data: [{ id: 1 }] }), [{ id: 1 }]);
  assert.deepEqual(unwrapCollection({ Trip: [{ id: 3 }] }), [{ id: 3 }]);
  assert.deepEqual(unwrapCollection([{ id: 2 }]), [{ id: 2 }]);
});

test("unwraps a detail response", () => {
  assert.deepEqual(unwrapDetail({ data: { id: "T1" } }), { id: "T1" });
});

test("normalizes nested trip data", () => {
  const vehicle = normalizeVehicle({ id: "T42", vehicle: { id: 301 }, line: { number: "2" }, nextStop: { name: "Theater" }, destination: { name: "Kuhberg" }, position: { latitude: 48.4, longitude: 10 } });
  assert.deepEqual({ id: vehicle.tripId, number: vehicle.vehicleNumber, line: vehicle.line, stop: vehicle.nextStop, destination: vehicle.destination }, { id: "T42", number: "301", line: "2", stop: "Theater", destination: "Kuhberg" });
  assert.equal(detailEndpoint(vehicle), "/api/trips/T42");
});

test("maps local API routes to the SWU upstream", () => {
  assert.equal(upstreamUrl("/api/trips"), "https://api.swu.de/mobility/v1/vehicle/trip/Trip");
  assert.equal(upstreamUrl("/api/trips/T%2042"), "https://api.swu.de/mobility/v1/vehicle/trip/Trip/T%2042");
  assert.equal(upstreamUrl("/styles.css"), null);
});
