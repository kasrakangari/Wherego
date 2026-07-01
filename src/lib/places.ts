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
  reason: string;
  mapsUrl: string;
};

export type PlaceDecision = {
  city: "Berlin";
  query: string;
  center: {
    lat: number;
    lng: number;
  };
  places: Place[];
};

const berlinPlaces: Place[] = [
  {
    id: "silo-coffee",
    name: "Silo Coffee",
    category: "Cafe",
    lat: 52.51292,
    lng: 13.45672,
    score: 0.96,
    vibe: ["brunch", "coffee", "casual"],
    primaryVibe: "food",
    price: "€€",
    distance: "2.9 km",
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
    score: 0.93,
    vibe: ["quiet", "study", "laptop"],
    primaryVibe: "study",
    price: "€€",
    distance: "1.5 km",
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
    score: 0.91,
    vibe: ["romantic", "historic", "date"],
    primaryVibe: "date",
    price: "€€€",
    distance: "1.2 km",
    reason:
      "Best date-night answer near Mitte: memorable atmosphere, dinner energy, and a clear sense of occasion.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Clarchens%20Ballhaus%20Berlin",
  },
  {
    id: "markthalle-neun",
    name: "Markthalle Neun",
    category: "Food hall",
    lat: 52.50214,
    lng: 13.43191,
    score: 0.88,
    vibe: ["cheap", "food", "casual"],
    primaryVibe: "food",
    price: "€",
    distance: "3.0 km",
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
    score: 0.84,
    vibe: ["outdoor", "casual", "river"],
    primaryVibe: "casual",
    price: "€€",
    distance: "2.0 km",
    reason:
      "Best relaxed outdoor option: riverside setting, casual drinks, and easy Berlin energy.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Holzmarkt%2025%20Berlin",
  },
];

const intentTerms: Record<PlaceVibe, string[]> = {
  study: ["quiet", "study", "work", "laptop", "read", "focus", "cafe", "coffee"],
  food: ["food", "eat", "cheap", "brunch", "restaurant", "hungry", "lunch", "dinner"],
  date: ["date", "romantic", "night", "special", "dinner", "wine"],
  casual: ["casual", "outdoor", "bar", "drink", "river", "friends", "sun"],
};

export function decideBerlinPlaces(query: string): PlaceDecision {
  const normalizedQuery = query.toLowerCase();

  const ranked = berlinPlaces
    .map((place) => {
      const intentBoost = intentTerms[place.primaryVibe].some((term) =>
        normalizedQuery.includes(term),
      )
        ? 0.08
        : 0;
      const tagBoost =
        place.vibe.filter((tag) => normalizedQuery.includes(tag)).length * 0.025;

      return {
        ...place,
        score: Math.min(Number((place.score + intentBoost + tagBoost).toFixed(2)), 0.99),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    city: "Berlin",
    query,
    center: {
      lat: 52.52,
      lng: 13.405,
    },
    places: ranked,
  };
}
