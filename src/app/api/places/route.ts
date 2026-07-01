import { NextResponse } from "next/server";
import { decideBerlinPlaces } from "@/lib/places";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const query = body.query?.trim() || "best places in Berlin right now";

  return NextResponse.json(decideBerlinPlaces(query));
}
