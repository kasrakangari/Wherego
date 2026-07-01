import { NextResponse } from "next/server";
import { isPlaceCategory, getNearbyPlaces } from "@/lib/places/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusKm = Number(searchParams.get("radiusKm") ?? 2);
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
  const categoryParam = searchParams.get("category");
  const category = isPlaceCategory(categoryParam) ? categoryParam : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const nearbyPlaces = await getNearbyPlaces(lat, lng, radiusKm);
  const places = nearbyPlaces
    .filter((place) => !category || place.category === category)
    .slice(0, limit);

  return NextResponse.json({
    origin: { lat, lng },
    radiusKm,
    count: places.length,
    places,
    attribution: "Place data © OpenStreetMap contributors",
  });
}
