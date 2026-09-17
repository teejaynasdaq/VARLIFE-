import { getRecentDestinations, getSavedLocations } from "@/lib/supabase";

export interface RideRecommendation {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "home" | "campus" | "favourite" | "recent" | "frequent";
  icon: string;
}

const CAMPUS_KEYWORDS = [
  "campus",
  "university",
  "college",
  "wits",
  "uct",
  "up",
  "ukzn",
];

function classifySaved(title: string): RideRecommendation["type"] {
  const lower = title.toLowerCase();
  if (lower.includes("home")) return "home";
  if (CAMPUS_KEYWORDS.some((k) => lower.includes(k))) return "campus";
  return "favourite";
}

function iconForType(type: RideRecommendation["type"]): string {
  switch (type) {
    case "home":
      return "home";
    case "campus":
      return "school";
    case "frequent":
      return "repeat";
    default:
      return "star";
  }
}

/**
 * Builds smart destination recommendations from saved locations and ride history.
 */
export async function getRideRecommendations(
  userId: string,
): Promise<RideRecommendation[]> {
  const [saved, recent] = await Promise.all([
    getSavedLocations(userId),
    getRecentDestinations(userId, 5),
  ]);

  const recommendations: RideRecommendation[] = [];
  const seen = new Set<string>();

  for (const loc of saved) {
    const key = loc.address?.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const type = classifySaved(loc.title ?? "");
    recommendations.push({
      id: `saved-${loc.id}`,
      label: loc.title,
      address: loc.address,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      type,
      icon: iconForType(type),
    });
  }

  for (const dest of recent) {
    const key = dest.address.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    recommendations.push({
      id: `recent-${key.slice(0, 20)}`,
      label: "Recent",
      address: dest.address,
      latitude: dest.latitude,
      longitude: dest.longitude,
      type: "recent",
      icon: "time",
    });
  }

  return recommendations.slice(0, 8);
}

/**
 * Time-based suggestion labels (e.g. morning commute to campus).
 */
export function getTimeBasedHint(): string | null {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "Morning commute";
  if (hour >= 16 && hour < 20) return "Evening return trip";
  if (hour >= 20 || hour < 5) return "Late night ride";
  return null;
}
