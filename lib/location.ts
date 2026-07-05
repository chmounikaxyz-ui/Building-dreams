// ── Haversine distance formula ──────────────────────────────────────────────
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 0.005) return ""
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// ── Reverse geocoding via OpenStreetMap Nominatim (free, no key needed) ─────
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    )
    if (!res.ok) throw new Error("Nominatim error")
    const data = await res.json()
    const addr = data.address ?? {}
    const parts = [
      addr.suburb || addr.neighbourhood || addr.village || addr.town,
      addr.city || addr.county,
      addr.state,
    ].filter(Boolean)
    return parts.slice(0, 2).join(", ") || data.display_name?.split(",")[0] || "Unknown location"
  } catch {
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
  }
}

// ── Get current position as a Promise ───────────────────────────────────────
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })
  })
}
