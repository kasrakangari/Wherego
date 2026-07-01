import { NextResponse } from "next/server";
import { getNearbyPlaces } from "@/lib/places/repository";
import { rankRecommendations } from "@/lib/recommend/rank";
import type { Coordinates } from "@/lib/places/distance";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    origin?: Coordinates;
    radiusKm?: number;
  };
  const query = body.query?.trim() || "best places nearby";
  const origin = body.origin ?? { lat: 52.52, lng: 13.405 };
  const radiusKm = body.radiusKm ?? 2;

  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    return NextResponse.json({ error: "origin.lat and origin.lng are required" }, { status: 400 });
  }

  const nearbyPlaces = await getNearbyPlaces(origin.lat, origin.lng, radiusKm);
  const places = rankRecommendations(query, nearbyPlaces);

  return NextResponse.json({
    origin,
    radiusKm,
    places,
    attribution: "Place data © OpenStreetMap contributors",
  });
}
