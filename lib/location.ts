export type GeoStatus = "idle" | "loading" | "success" | "denied" | "error";

export interface UserLocation {
  label: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

const STORAGE_KEY = "cafnet_user_location";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

declare global {
  interface Window {
    google?: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: { location: { lat: number; lng: number } },
            callback: (
              results: Array<{
                address_components: Array<{ long_name: string; types: string[] }>;
                formatted_address: string;
              }> | null,
              status: string
            ) => void
          ) => void;
        };
      };
    };
  }
}

/* ── Preferred address component types (most specific → least) ── */
const PREFERRED_TYPES = [
  "neighborhood",
  "sublocality_level_1",
  "sublocality",
  "administrative_area_level_2",
  "locality",
];

/**
 * Addis Ababa neighborhood coordinates mapping for offline / network-fallback.
 */
function getBoundingBoxFallback(lat: number, lon: number): string {
  // Check if roughly within Addis Ababa metropolitan area
  if (lat >= 8.82 && lat <= 9.12 && lon >= 38.65 && lon <= 38.92) {
    // Piassa / Arada (around 9.03 - 9.05, 38.735 - 38.76)
    if (lat >= 9.025 && lat <= 9.055 && lon >= 38.735 && lon <= 38.76) {
      return "Piassa";
    }
    // Merkato / Addis Ketema (around 9.015 - 9.045, 38.715 - 38.74)
    if (lat >= 9.015 && lat <= 9.045 && lon >= 38.715 && lon <= 38.74) {
      return "Merkato";
    }
    // Kazanchis / Kirkos (around 9.008 - 9.030, 38.755 - 38.775)
    if (lat >= 9.008 && lat <= 9.030 && lon >= 38.755 && lon <= 38.775) {
      return "Kazanchis";
    }
    // Bole area (Airport, Atlas, Medhanialem, Rwanda, Olympia, etc. east of Kazanchis)
    if (lat >= 8.96 && lat <= 9.035 && lon >= 38.775 && lon <= 38.86) {
      return "Bole";
    }
    return "Addis Ababa";
  }

  // Broad Ethiopia boundary
  if (lat >= 3.4 && lat <= 15.0 && lon >= 32.9 && lon <= 48.0) {
    return "Addis Ababa";
  }

  return "Current location";
}

/**
 * Reverse geocodes lat/lon via Google Maps Geocoder or OSM Nominatim,
 * with graceful offline / boundary fallback.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // 1. Try Google Maps JS SDK Geocoder if loaded and available
  if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
    try {
      const googleResult = await new Promise<string | null>((resolve) => {
        const geocoder = new window.google!.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            for (const result of results) {
              for (const targetType of PREFERRED_TYPES) {
                const match = result.address_components.find((c) =>
                  c.types.includes(targetType)
                );
                if (match?.long_name) {
                  return resolve(match.long_name);
                }
              }
            }
            if (results[0]?.formatted_address) {
              return resolve(results[0].formatted_address.split(",")[0].trim());
            }
          }
          resolve(null);
        });
      });

      if (googleResult) return googleResult;
    } catch {
      // Continue to Nominatim fallback
    }
  }

  // 2. Fallback to OSM Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const a = data.address ?? {};
      const resolved =
        a.neighbourhood ||
        a.suburb ||
        a.quarter ||
        a.city_district ||
        a.district ||
        a.village ||
        a.town ||
        a.city ||
        a.county;

      if (resolved && typeof resolved === "string") {
        return resolved;
      }
    }
  } catch {
    // Continue to fallback
  }

  // 3. Fallback based on coordinate location
  return getBoundingBoxFallback(lat, lon);
}

/**
 * Retrieves the cached user location from localStorage if valid.
 */
export function getCachedLocation(): UserLocation | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: UserLocation = JSON.parse(raw);
    if (!data.label || !data.latitude || !data.longitude || !data.timestamp) {
      return null;
    }
    // Check if expired
    if (Date.now() - data.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Persists the resolved user location in localStorage.
 */
export function setCachedLocation(data: UserLocation): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}
