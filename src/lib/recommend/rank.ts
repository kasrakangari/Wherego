import { formatDistanceKm } from "@/lib/places/distance";
import type { PlaceWithDistance } from "@/lib/places/repository";
import { parseIntent } from "@/lib/recommend/intent";

export type RecommendedPlace = PlaceWithDistance & {
  score: number;
  vibe: string[];
  price: "€" | "€€" | "€€€";
  distance: string;
  reason: string;
};

function estimatePrice(place: PlaceWithDistance): "€" | "€€" | "€€€" {
  const priceTag =
    place.rawTags["price"] ||
    place.rawTags["price:range"] ||
    place.rawTags["payment:cash"];

  if (priceTag?.includes("€€€")) {
    return "€€€";
  }

  if (place.category === "bar" || place.category === "restaurant") {
    return "€€";
  }

  return "€";
}

function createReason(place: PlaceWithDistance, query: string, vibes: string[]) {
  const intentText = vibes.length > 0 ? vibes.slice(0, 2).join(" and ") : query;
  const cuisine = place.cuisine?.[0] ? ` ${place.cuisine[0]}` : "";

  return `Close to your selected location and matches your ${intentText}${cuisine} intent.`;
}

export function rankRecommendations(
  query: string,
  places: PlaceWithDistance[],
): RecommendedPlace[] {
  const intent = parseIntent(query);

  return places
    .map((place) => {
      const categoryScore = intent.categories.includes(place.category) ? 0.28 : 0;
      const tagScore =
        intent.tags.filter((tag) => place.tags.includes(tag)).length * 0.08;
      const cuisineScore =
        intent.cuisines.filter((cuisine) => place.cuisine?.includes(cuisine)).length *
        0.18;
      const nameScore = intent.cuisines.some((term) =>
        place.name.toLowerCase().includes(term),
      )
        ? 0.12
        : 0;
      const distanceScore = Math.max(0, 0.28 - place.distanceKm * 0.035);
      const namedPlaceScore = place.name === "Unnamed place" ? -0.12 : 0;
      const score = Math.min(
        0.99,
        Number(
          (0.42 + categoryScore + tagScore + cuisineScore + nameScore + distanceScore + namedPlaceScore).toFixed(2),
        ),
      );
      const vibe = [...new Set([...intent.vibes, ...place.tags.slice(0, 3)])].slice(0, 5);

      return {
        ...place,
        score,
        vibe,
        price: estimatePrice(place),
        distance: formatDistanceKm(place.distanceKm),
        reason: createReason(place, query, vibe),
      };
    })
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .slice(0, 5);
}
