export type Coordinates = {
  lat: number;
  lng: number;
};

export type OriginMode = "city" | "live" | "manual";

export type PlaceVibe = "study" | "food" | "date" | "casual";

export type Place = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  score: number;
  vibe: string[];
  primaryVibe: PlaceVibe;
  price: "€" | "€€" | "€€€";
  distance: string;
  distanceKm: number;
  reason: string;
  mapsUrl: string;
};

export type PlaceDecision = {
  city: "Berlin";
  query: string;
  origin: Coordinates;
  originMode: OriginMode;
  radiusKm: number;
  places: Place[];
};

type PlaceSeed = Omit<Place, "score" | "distance" | "distanceKm"> & {
  baseScore: number;
};

export const berlinCenter: Coordinates = {
  lat: 52.52,
  lng: 13.405,
};

const berlinPlaces: PlaceSeed[] = [
  {
    id: "silo-coffee",
    name: "Silo Coffee",
    category: "Cafe",
    lat: 52.51292,
    lng: 13.45672,
    baseScore: 0.96,
    vibe: ["brunch", "coffee", "casual"],
    primaryVibe: "food",
    price: "€€",
    reason:
      "Best first pick when the intent is excellent coffee with reliable food and a lively Friedrichshain feel.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Silo%20Coffee%20Berlin",
  },
  {
    id: "st-oberholz",
    name: "St. Oberholz",
    category: "Cafe",
    lat: 52.52949,
    lng: 13.41152,
    baseScore: 0.93,
    vibe: ["quiet", "study", "laptop"],
    primaryVibe: "study",
    price: "€€",
    reason:
      "Strong match for focus work: central, laptop-friendly, and calmer outside peak rush.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=St.%20Oberholz%20Berlin",
  },
  {
    id: "clarchens-ballhaus",
    name: "Clarchens Ballhaus",
    category: "Restaurant",
    lat: 52.5261,
    lng: 13.3943,
    baseScore: 0.91,
    vibe: ["romantic", "historic", "date"],
    primaryVibe: "date",
    price: "€€€",
    reason:
      "Best date-night answer near the selected origin: memorable atmosphere, dinner energy, and a clear sense of occasion.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Clarchens%20Ballhaus%20Berlin",
  },
  {
    id: "markthalle-neun",
    name: "Markthalle Neun",
    category: "Food hall",
    lat: 52.50214,
    lng: 13.43191,
    baseScore: 0.88,
    vibe: ["cheap", "food", "casual"],
    primaryVibe: "food",
    price: "€",
    reason:
      "A low-friction food choice when the user wants variety without browsing individual restaurants.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Markthalle%20Neun%20Berlin",
  },
  {
    id: "holzmarkt",
    name: "Holzmarkt 25",
    category: "Outdoor bar",
    lat: 52.51006,
    lng: 13.42986,
    baseScore: 0.84,
    vibe: ["outdoor", "casual", "river"],
    primaryVibe: "casual",
    price: "€€",
    reason:
      "Best relaxed outdoor option: riverside setting, casual drinks, and easy Berlin energy.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Holzmarkt%2025%20Berlin",
  },
  {
    id: "burgermeister-kotti",
    name: "Burgermeister Kottbusser Tor",
    category: "Burger",
    lat: 52.49976,
    lng: 13.41826,
    baseScore: 0.86,
    vibe: ["burger", "cheap", "food"],
    primaryVibe: "food",
    price: "€",
    reason:
      "Fast, iconic, and direct: the strongest burger answer around Kreuzberg without turning the map into a directory.",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Burgermeister%20Kottbusser%20Tor%20Berlin",
  },
  {
    id: "house-of-small-wonder",
    name: "House of Small Wonder",
    category: "Cafe",
    lat: 52.52322,
    lng: 13.39931,
    baseScore: 0.87,
    vibe: ["brunch", "date", "cozy"],
    primaryVibe: "date",
    price: "€€",
    reason:
      "Cozy, distinctive, and easy to choose when the user wants a softer cafe-date option near the origin.",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=House%20of%20Small%20Wonder%20Berlin",
  },
  {
    id: "isla-coffee",
    name: "Isla Coffee Berlin",
    category: "Cafe",
    lat: 52.48692,
    lng: 13.4232,
    baseScore: 0.85,
    vibe: ["quiet", "coffee", "study"],
    primaryVibe: "study",
    price: "€€",
    reason:
      "A calm south-Berlin cafe pick with strong coffee and enough quiet for focused planning or study.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Isla%20Coffee%20Berlin",
  },
];

const intentTerms: Record<PlaceVibe, string[]> = {
  study: ["quiet", "study", "work", "laptop", "read", "focus", "cafe", "coffee"],
  food: ["food", "eat", "cheap", "brunch", "burger", "restaurant", "hungry", "lunch", "dinner"],
  date: ["date", "romantic", "night", "special", "dinner", "wine", "cozy"],
  casual: ["casual", "outdoor", "bar", "drink", "river", "friends", "sun"],
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export function decideBerlinPlaces(
  query: string,
  origin: Coordinates = berlinCenter,
  originMode: OriginMode = "city",
  radiusKm = 5,
): PlaceDecision {
  const normalizedQuery = query.toLowerCase();

  const ranked = berlinPlaces
    .map((place) => {
      const { baseScore, ...publicPlace } = place;
      const distanceKm = Number(
        distanceInKm(origin, { lat: place.lat, lng: place.lng }).toFixed(2),
      );
      const intentBoost = intentTerms[place.primaryVibe].some((term) =>
        normalizedQuery.includes(term),
      )
        ? 0.08
        : 0;
      const tagBoost =
        place.vibe.filter((tag) => normalizedQuery.includes(tag)).length * 0.025;
      const distanceBoost = Math.max(0, (radiusKm - distanceKm) / radiusKm) * 0.08;
      const outsideRadiusPenalty = distanceKm > radiusKm ? 0.24 : 0;

      return {
        ...publicPlace,
        distanceKm,
        distance: formatDistance(distanceKm),
        score: Math.min(
          Number(
            (
              baseScore +
              intentBoost +
              tagBoost +
              distanceBoost -
              outsideRadiusPenalty
            ).toFixed(2),
          ),
          0.99,
        ),
      };
    })
    .filter((place) => place.distanceKm <= radiusKm || radiusKm >= 5)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .slice(0, 5);

  return {
    city: "Berlin",
    query,
    origin,
    originMode,
    radiusKm,
    places: ranked,
  };
}
