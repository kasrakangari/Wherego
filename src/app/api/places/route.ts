import { NextResponse } from "next/server";
import { berlinCenter, decideBerlinPlaces } from "@/lib/places";
import type { Coordinates, OriginMode } from "@/lib/places";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    origin?: Coordinates;
    originMode?: OriginMode;
    radiusKm?: number;
  };
  const query = body.query?.trim() || "best places in Berlin right now";
  const origin = body.origin ?? berlinCenter;
  const originMode = body.originMode ?? "city";
  const radiusKm = body.radiusKm ?? 5;

  return NextResponse.json(decideBerlinPlaces(query, origin, originMode, radiusKm));
}
