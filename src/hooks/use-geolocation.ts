"use client";

import { useCallback, useEffect, useState } from "react";
import { saveLocation, type UserLocation } from "@/lib/local-db";

/**
 * useGeolocation — get the user's current GPS position.
 *
 * Uses navigator.geolocation.getCurrentPosition. The browser prompts the user
 * for permission on first use. The captured position is saved to IndexedDB
 * so we can fall back to it if the user later denies ongoing access.
 *
 * Also reverse-geocodes via open-meteo's geocoding API (best-effort) to get
 * a human-readable place name.
 */

interface Coords { lat: number; lng: number; }
type Status = "idle" | "loading" | "success" | "error";

interface UseGeolocationReturn {
  position: Coords | null;
  placeName: string | null;
  status: Status;
  error: string | null;
  /** Ask the browser for the current position (prompts for permission). */
  request: () => Promise<Coords | null>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<Coords | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // On mount, try to load last known location from IndexedDB (no prompt).
  useEffect(() => {
    (async () => {
      const last = await getLastLocationFromDb();
      if (last) {
        setPosition({ lat: last.lat, lng: last.lng });
        setPlaceName(last.name ?? null);
      }
    })();
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      // open-meteo's reverse geocoding endpoint (free, no API key).
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&count=1&language=pt&format=json`,
      );
      if (!r.ok) return null;
      const data = await r.json();
      const place = data?.results?.[0];
      if (!place) return null;
      const parts = [place.name, place.admin1, place.country_code].filter(Boolean);
      return parts.join(", ");
    } catch {
      return null;
    }
  }, []);

  const request = useCallback(async (): Promise<Coords | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocalização não suportada neste dispositivo.");
      setStatus("error");
      return null;
    }
    setStatus("loading");
    setError(null);
    return new Promise<Coords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(coords);
          setStatus("success");
          // Reverse-geocode to get a place name
          const name = await reverseGeocode(coords.lat, coords.lng);
          if (name) setPlaceName(name);
          // Persist to IndexedDB for future fallback
          const record: Omit<UserLocation, "id"> = {
            capturedAt: Date.now(),
            lat: coords.lat,
            lng: coords.lng,
            name: name ?? undefined,
          };
          await saveLocation(record);
          resolve(coords);
        },
        (err) => {
          let msg = "Erro de geolocalização.";
          if (err.code === err.PERMISSION_DENIED) msg = "Permissão de localização negada. Autorize nas configurações do navegador.";
          else if (err.code === err.POSITION_UNAVAILABLE) msg = "Posição indisponível. Verifique seu GPS.";
          else if (err.code === err.TIMEOUT) msg = "Tempo limite excedido ao obter localização.";
          setError(msg);
          setStatus("error");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, [reverseGeocode]);

  return { position, placeName, status, error, request };
}

// Helper imported here to avoid circular dependency warning
async function getLastLocationFromDb(): Promise<UserLocation | null> {
  try {
    const { getLastLocation } = await import("@/lib/local-db");
    return await getLastLocation();
  } catch {
    return null;
  }
}
