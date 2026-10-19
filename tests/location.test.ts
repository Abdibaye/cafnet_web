import test from "node:test";
import assert from "node:assert/strict";
import {
  reverseGeocode,
  getCachedLocation,
  setCachedLocation,
  type UserLocation,
} from "../lib/location";

// Mock localStorage for node test environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
  length: 0,
  key: () => null,
};

test("Location: setCachedLocation and getCachedLocation save and load data correctly", () => {
  const sample: UserLocation = {
    label: "Bole",
    latitude: 9.001,
    longitude: 38.785,
    timestamp: Date.now(),
  };

  setCachedLocation(sample);
  const loaded = getCachedLocation();

  assert.ok(loaded);
  assert.equal(loaded.label, "Bole");
  assert.equal(loaded.latitude, 9.001);
  assert.equal(loaded.longitude, 38.785);
});

test("Location: getCachedLocation prunes expired entries", () => {
  const expired: UserLocation = {
    label: "Kazanchis",
    latitude: 9.015,
    longitude: 38.765,
    timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago (>24h limit)
  };

  setCachedLocation(expired);
  const loaded = getCachedLocation();

  assert.equal(loaded, null);
});

test("Location: reverseGeocode resolves Bole coordinates", async () => {
  // Lat 8.99, Lon 38.79 is in Bole
  const resolved = await reverseGeocode(8.99, 38.79);
  assert.ok(resolved);
  assert.equal(resolved, "Bole");
});

test("Location: reverseGeocode falls back gracefully on network error", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    // Bole coordinates
    const bole = await reverseGeocode(8.99, 38.79);
    assert.equal(bole, "Bole");

    // Kazanchis coordinates
    const kazanchis = await reverseGeocode(9.018, 38.768);
    assert.equal(kazanchis, "Kazanchis");

    // Piassa coordinates
    const piassa = await reverseGeocode(9.035, 38.750);
    assert.equal(piassa, "Piassa");

    // Outside Addis Ababa but in Ethiopia
    const ethiopia = await reverseGeocode(11.5, 37.3);
    assert.equal(ethiopia, "Addis Ababa");

    // Outside Ethiopia
    const abroad = await reverseGeocode(51.5, -0.12);
    assert.equal(abroad, "Current location");
  } finally {
    global.fetch = originalFetch;
  }
});
