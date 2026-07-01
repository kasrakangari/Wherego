import { promises as fs } from "fs";
import path from "path";
import { placeCategories, type PlaceCategory } from "@/lib/places/categories";
import { calculateDistanceKm } from "@/lib/places/distance";
import type { Place } from "@/lib/osm/types";

export type PlaceWithDistance = Place & {
  distanceKm: number;
};

export type FilterPlacesParams = {
  category?: PlaceCategory;
  limit?: number;
  offset?: number;
  query?: string;
};

const dataPath = path.join(process.cwd(), "data", "berlin-places.json");
let placesCache: Place[] | null = null;

async function readPlacesFile() {
  try {
    const content = await fs.readFile(dataPath, "utf8");
    return JSON.parse(content) as Place[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function getAllPlaces(): Promise<Place[]> {
  if (placesCache == null) {
    placesCache = await readPlacesFile();
  }

  return placesCache;
}

export function clearPlacesCache() {
  placesCache = null;
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const places = await getAllPlaces();
  return places.find((place) => place.id === id) ?? null;
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<PlaceWithDistance[]> {
  const places = await getAllPlaces();

  return places
    .map((place) => ({
      ...place,
      distanceKm: Number(calculateDistanceKm(lat, lng, place.lat, place.lng).toFixed(2)),
    }))
    .filter((place) => place.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function filterPlaces(params: FilterPlacesParams): Promise<Place[]> {
  const limit = Math.min(params.limit ?? 500, 1000);
  const offset = params.offset ?? 0;
  const query = params.query?.trim().toLowerCase();
  const places = await getAllPlaces();

  return places
    .filter((place) => {
      if (params.category && place.category !== params.category) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [place.name, place.category, place.cuisine?.join(" "), place.tags.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .slice(offset, offset + limit);
}

export function isPlaceCategory(value: string | null): value is PlaceCategory {
  return Boolean(value && placeCategories.includes(value as PlaceCategory));
}
