const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export const googleMaps = {
  // 1. Autocomplete / Places Search
  searchPlaces: async (query: string, userLat: number, userLon: number) => {
    if (!query || query.length < 3) return [];
    try {
      // Only include location bias if the coordinates are valid (not 0,0)
      const locationBias =
        userLat !== 0 && userLon !== 0
          ? `&location=${userLat},${userLon}&origin=${userLat},${userLon}&radius=50000`
          : "";

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}${locationBias}&components=country:za&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();

      return data.predictions.map((f: any) => ({
        description: f.description,
        mainText: f.structured_formatting.main_text,
        secondaryText: f.structured_formatting.secondary_text || "",
        placeId: f.place_id,
        distanceMeters: f.distance_meters || 0,
        latitude: 0,
        longitude: 0,
      }));
    } catch (error) {
      console.error("Google Places search error:", error);
      return [];
    }
  },

  // 1b. Get Place Details (Lat/Lon)
  getPlaceDetails: async (placeId: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      if (data.result?.geometry?.location) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Google Place Details error:", error);
      return null;
    }
  },

  // 2. Reverse Geocoding
  reverseGeocode: async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const components = data.results[0].address_components || [];
        let route = "";
        let locality = "";

        for (const comp of components) {
          if (comp.types.includes("route")) route = comp.short_name;
          if (
            comp.types.includes("locality") ||
            comp.types.includes("sublocality")
          ) {
            locality = comp.long_name;
          }
        }

        if (route && locality) return `${route}, ${locality}`;
        if (locality) return locality;
        if (route) return route;

        const address = data.results[0].formatted_address;
        const parts = address.split(",");
        if (parts.length > 1) {
          return `${parts[0].trim()}, ${parts[1].trim()}`;
        }
        return address;
      }
      return null;
    } catch (error) {
      console.error("Google reverse geocode error:", error);
      return null;
    }
  },

  // 3. Routing (Directions)
  getRoute: async (
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    waypoints?: { latitude: number; longitude: number }[]
  ) => {
    try {
      let waypointsQuery = "";
      if (waypoints && waypoints.length > 0) {
        const wpStr = waypoints.map((w) => `${w.latitude},${w.longitude}`).join("|");
        waypointsQuery = `&waypoints=optimize:true|${wpStr}`;
      }

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLon}&destination=${destLat},${destLon}${waypointsQuery}&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline string to array of {latitude, longitude}
        const polyline = route.overview_polyline.points;
        const coords = decodePolyline(polyline);

        const distanceKm = Number((leg.distance.value / 1000).toFixed(1));
        const durationMin = Math.ceil(leg.duration.value / 60);
        return { coords, distanceKm, durationMin };
      }

      return null;
    } catch (error) {
      console.error("Google routing error:", error);
      return null;
    }
  },

  // 4. Distance Matrix (ETA between two points)
  getDistanceMatrix: async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      const element = data.rows?.[0]?.elements?.[0];
      if (element?.status === "OK") {
        return {
          durationText: element.duration?.text ?? "5 min",
          distanceText: element.distance?.text ?? "",
        };
      }
      return null;
    } catch (error) {
      console.error("Google distance matrix error:", error);
      return null;
    }
  },

  // 5. Haversine distance calculation
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a =
      0.5 -
      c((lat2 - lat1) * p) / 2 +
      (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  },
};

// Helper function to decode Google Maps polyline
function decodePolyline(encoded: string) {
  const poly = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
}
