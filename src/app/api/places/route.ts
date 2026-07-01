import { NextResponse } from "next/server";
import { filterPlaces, isPlaceCategory } from "@/lib/places/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const limit = Number(searchParams.get("limit") ?? 500);
  const query = searchParams.get("query") ?? undefined;
  const category = isPlaceCategory(categoryParam) ? categoryParam : undefined;
  const places = await filterPlaces({ category, limit, query });

  return NextResponse.json({
    count: places.length,
    places,
    attribution: "Place data © OpenStreetMap contributors",
  });
}
