export type PlaceCategory =
  | "restaurant"
  | "cafe"
  | "bar"
  | "pub"
  | "fast_food"
  | "food_court"
  | "biergarten"
  | "ice_cream"
  | "bakery"
  | "coffee_shop"
  | "dessert"
  | "unknown";

export const placeCategories: PlaceCategory[] = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "fast_food",
  "food_court",
  "biergarten",
  "ice_cream",
  "bakery",
  "coffee_shop",
  "dessert",
  "unknown",
];

export function normalizeCategory(tags: Record<string, string>): PlaceCategory {
  switch (tags.amenity) {
    case "restaurant":
    case "cafe":
    case "bar":
    case "pub":
    case "fast_food":
    case "food_court":
    case "biergarten":
    case "ice_cream":
      return tags.amenity;
    default:
      break;
  }

  switch (tags.shop) {
    case "bakery":
      return "bakery";
    case "coffee":
      return "coffee_shop";
    case "confectionery":
      return "dessert";
    default:
      return "unknown";
  }
}
