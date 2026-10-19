"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  reverseGeocode,
  getCachedLocation,
  setCachedLocation,
  type GeoStatus,
} from "@/lib/location";

export interface LocationContextValue {
  /** The loaded user location name (e.g. "Bole", "Kazanchis", "Addis Ababa") */
  location: string;
  /** The placeholder string reflecting loading or loaded state */
  placeholder: string;
  /** GPS coordinates if available */
  coordinates: { latitude: number; longitude: number } | null;
  /** Status of geolocation detection */
  geoStatus: GeoStatus;
  /** True while actively querying browser GPS or reverse geocoding */
  isDetecting: boolean;
  /** Function to trigger or re-trigger location detection */
  detectLocation: () => void;
  /** Function to set/override the location manually */
  setLocation: (loc: string) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const DEFAULT_PLACEHOLDER = "Neighbourhood or city...";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // Initialize with cached location for instant zero-latency loading
  const [location, setLocationState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return getCachedLocation()?.label || "";
  });

  const [placeholder, setPlaceholder] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_PLACEHOLDER;
    return getCachedLocation()?.label || DEFAULT_PLACEHOLDER;
  });

  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(() => {
    if (typeof window === "undefined") return null;
    const cached = getCachedLocation();
    return cached ? { latitude: cached.latitude, longitude: cached.longitude } : null;
  });

  const [geoStatus, setGeoStatus] = useState<GeoStatus>(() => {
    if (typeof window === "undefined") return "idle";
    return getCachedLocation()?.label ? "success" : "idle";
  });

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const hasTriggeredInitial = useRef(false);

  const detectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      setIsDetecting(false);
      return;
    }

    setIsDetecting(true);
    setGeoStatus("loading");

    // Only change placeholder to "Detecting location..." if no cached location is present
    const cached = getCachedLocation();
    if (!cached?.label) {
      setPlaceholder("Detecting location...");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoordinates({ latitude: lat, longitude: lon });

        try {
          const resolved = await reverseGeocode(lat, lon);
          const finalLocation = resolved || "Current location";
          setLocationState(finalLocation);
          setPlaceholder(finalLocation);
          setGeoStatus("success");
          setIsDetecting(false);

          setCachedLocation({
            label: finalLocation,
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
          });
        } catch {
          const fallback = "Current location";
          setLocationState(fallback);
          setPlaceholder(fallback);
          setGeoStatus("success");
          setIsDetecting(false);

          setCachedLocation({
            label: fallback,
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
          });
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setGeoStatus("denied");
        } else {
          setGeoStatus("error");
        }

        // Keep cached location if we have one, otherwise fallback to default placeholder
        const existingCached = getCachedLocation();
        if (existingCached?.label) {
          setLocationState(existingCached.label);
          setPlaceholder(existingCached.label);
        } else {
          setPlaceholder(DEFAULT_PLACEHOLDER);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // When user opens platform, automatically load location
  useEffect(() => {
    if (hasTriggeredInitial.current) return;
    hasTriggeredInitial.current = true;

    // Trigger automatic location detection on mount
    detectLocation();
  }, [detectLocation]);

  const setLocation = useCallback((newLoc: string) => {
    const trimmed = newLoc.trim();
    setLocationState(trimmed);
    if (trimmed) {
      setPlaceholder(trimmed);
    } else {
      const cached = getCachedLocation();
      setPlaceholder(cached?.label || DEFAULT_PLACEHOLDER);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        placeholder,
        coordinates,
        geoStatus,
        isDetecting,
        detectLocation,
        setLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
