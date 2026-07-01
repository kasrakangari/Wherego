import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { normalizeOsmElement } from "../src/lib/osm/normalize";
import { fetchBerlinFoodPlacesFromOverpass } from "../src/lib/osm/overpass";
import type { Place } from "../src/lib/osm/types";

function countByCategory(places: Place[]) {
  return places.reduce<Record<string, number>>((counts, place) => {
    counts[place.category] = (counts[place.category] ?? 0) + 1;
    return counts;
  }, {});
}

async function main() {
  console.log("Fetching Berlin food and drink POIs from Overpass...");

  const response = await fetchBerlinFoodPlacesFromOverpass();
  const placesById = new Map<string, Place>();
  let skipped = 0;

  for (const element of response.elements) {
    const place = normalizeOsmElement(element);

    if (!place) {
      skipped += 1;
      continue;
    }

    placesById.set(place.id, place);
  }

  const places = [...placesById.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const dataDir = path.join(process.cwd(), "data");
  const outputPath = path.join(dataDir, "berlin-places.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(places, null, 2)}\n`, "utf8");

  console.log("Berlin OSM import complete");
  console.log(`Total fetched: ${response.elements.length}`);
  console.log(`Total normalized: ${places.length}`);
  console.log(`Total skipped: ${skipped}`);
  console.log("Count per category:");

  for (const [category, count] of Object.entries(countByCategory(places)).sort()) {
    console.log(`- ${category}: ${count}`);
  }
}

main().catch((error) => {
  console.error("Failed to import Berlin places");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
