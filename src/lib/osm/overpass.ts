import type { OverpassResponse } from "@/lib/osm/types";

export const defaultOverpassUrl = "https://overpass-api.de/api/interpreter";

export const berlinFoodOverpassQuery = `[out:json][timeout:180];
area["name"="Berlin"]["boundary"="administrative"]["admin_level"="4"]->.berlin;

(
  node["amenity"~"^(restaurant|cafe|bar|pub|fast_food|food_court|biergarten|ice_cream)$"](area.berlin);
  way["amenity"~"^(restaurant|cafe|bar|pub|fast_food|food_court|biergarten|ice_cream)$"](area.berlin);
  relation["amenity"~"^(restaurant|cafe|bar|pub|fast_food|food_court|biergarten|ice_cream)$"](area.berlin);

  node["shop"~"^(bakery|coffee|confectionery)$"](area.berlin);
  way["shop"~"^(bakery|coffee|confectionery)$"](area.berlin);
  relation["shop"~"^(bakery|coffee|confectionery)$"](area.berlin);
);

out center tags;`;

export async function fetchBerlinFoodPlacesFromOverpass(
  overpassUrl = process.env.OVERPASS_API_URL || defaultOverpassUrl,
): Promise<OverpassResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 210_000);

    try {
      const response = await fetch(overpassUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "WHEREgo/0.1 (OpenStreetMap data import)",
        },
        body: new URLSearchParams({ data: berlinFoodOverpassQuery }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Overpass returned ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch Berlin places from Overpass");
}
