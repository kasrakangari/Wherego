import { normalizeCategory } from "@/lib/places/categories";
import type { OverpassElement, Place } from "@/lib/osm/types";

function yesToBoolean(value?: string) {
  return value === "yes" ? true : undefined;
}

function splitCuisine(value?: string) {
  return value
    ?.split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createAddress(tags: Record<string, string>) {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  const postcode = tags["addr:postcode"];
  const city = tags["addr:city"];
  const streetLine = [street, houseNumber].filter(Boolean).join(" ");
  const cityLine = [postcode, city].filter(Boolean).join(" ");

  return [streetLine, cityLine].filter(Boolean).join(", ") || undefined;
}

function createTags(tags: Record<string, string>) {
  return [
    tags.amenity,
    tags.shop,
    ...(splitCuisine(tags.cuisine) ?? []),
    tags.outdoor_seating === "yes" ? "outdoor" : undefined,
    tags.takeaway === "yes" ? "takeaway" : undefined,
    tags.delivery === "yes" ? "delivery" : undefined,
    tags.wheelchair === "yes" ? "wheelchair" : undefined,
    tags.internet_access === "wlan" || tags.wifi === "yes" ? "wifi" : undefined,
  ]
    .filter((tag): tag is string => Boolean(tag))
    .filter((tag, index, tagsList) => tagsList.indexOf(tag) === index);
}

export function normalizeOsmElement(element: OverpassElement): Place | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};

  if (lat == null || lng == null) {
    return null;
  }

  const now = new Date().toISOString();
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  const postcode = tags["addr:postcode"];
  const city = tags["addr:city"];

  return {
    id: `osm-${element.type}-${element.id}`,
    source: "osm",
    osmId: String(element.id),
    osmType: element.type,
    name: tags.name || tags["name:en"] || tags.brand || "Unnamed place",
    category: normalizeCategory(tags),
    lat,
    lng,
    address: createAddress(tags),
    street,
    houseNumber,
    postcode,
    city,
    phone: tags.phone || tags["contact:phone"],
    website: tags.website || tags["contact:website"],
    email: tags.email || tags["contact:email"],
    cuisine: splitCuisine(tags.cuisine),
    openingHours: tags.opening_hours,
    wheelchair: tags.wheelchair,
    outdoorSeating: yesToBoolean(tags.outdoor_seating),
    takeaway: yesToBoolean(tags.takeaway),
    delivery: yesToBoolean(tags.delivery),
    tags: createTags(tags),
    rawTags: tags,
    createdAt: now,
    updatedAt: now,
  };
}
