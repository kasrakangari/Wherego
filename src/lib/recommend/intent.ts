import type { PlaceCategory } from "@/lib/places/categories";

export type Intent = {
  categories: PlaceCategory[];
  tags: string[];
  cuisines: string[];
  vibes: string[];
};

const cuisineTerms = [
  "burger",
  "pizza",
  "italian",
  "turkish",
  "kebab",
  "vietnamese",
  "thai",
  "japanese",
  "sushi",
  "indian",
  "vegan",
  "vegetarian",
  "coffee",
];

export function parseIntent(query: string): Intent {
  const normalized = query.toLowerCase();
  const intent: Intent = {
    categories: [],
    tags: [],
    cuisines: cuisineTerms.filter((term) => normalized.includes(term)),
    vibes: [],
  };

  if (/(study|quiet|work|laptop|focus)/.test(normalized)) {
    intent.categories.push("cafe", "coffee_shop");
    intent.tags.push("wifi", "coffee", "cafe");
    intent.vibes.push("quiet", "study-friendly");
  }

  if (/(date|romantic)/.test(normalized)) {
    intent.categories.push("restaurant", "bar");
    intent.vibes.push("date", "romantic");
  }

  if (/(cheap|budget|student)/.test(normalized)) {
    intent.categories.push("fast_food", "cafe", "bakery");
    intent.vibes.push("budget-friendly");
  }

  if (/(beer|drink|night)/.test(normalized)) {
    intent.categories.push("bar", "pub", "biergarten");
    intent.vibes.push("drinks", "night");
  }

  if (/(dessert|sweet|ice cream|icecream)/.test(normalized)) {
    intent.categories.push("ice_cream", "dessert", "bakery");
    intent.vibes.push("dessert");
  }

  if (/(food|eat|restaurant|lunch|dinner)/.test(normalized)) {
    intent.categories.push("restaurant", "fast_food", "food_court");
    intent.vibes.push("food");
  }

  return {
    ...intent,
    categories: [...new Set(intent.categories)],
    tags: [...new Set(intent.tags)],
    vibes: [...new Set(intent.vibes)],
  };
}
