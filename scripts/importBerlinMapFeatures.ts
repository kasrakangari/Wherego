import { mkdir, writeFile } from "fs/promises";
import path from "path";

const overpassUrl = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";
const minRenderableArea = 0.000002;
const maxRingPoints = 90;

const query = `[out:json][timeout:180];
area["name"="Berlin"]["boundary"="administrative"]["admin_level"="4"]->.berlin;
(
  way["leisure"="park"](area.berlin);
  relation["leisure"="park"](area.berlin);
  way["natural"~"^(wood|water)$"](area.berlin);
  relation["natural"~"^(wood|water)$"](area.berlin);
  way["landuse"~"^(forest|recreation_ground|reservoir)$"](area.berlin);
  relation["landuse"~"^(forest|recreation_ground|reservoir)$"](area.berlin);
  way["waterway"~"^(riverbank|dock|canal)$"](area.berlin);
  relation["waterway"~"^(riverbank|dock|canal)$"](area.berlin);
);
out tags geom;`;

type OverpassPoint = {
  lat: number;
  lon: number;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  tags?: Record<string, string>;
  geometry?: OverpassPoint[];
  members?: {
    geometry?: OverpassPoint[];
    role?: string;
    type?: string;
  }[];
};

type OverpassResponse = {
  elements: OverpassElement[];
};

type MapFeature = {
  id: string;
  kind: "green" | "water";
  name?: string;
  rings: [number, number][][];
};

function featureKind(tags: Record<string, string> = {}): MapFeature["kind"] {
  if (
    tags.natural === "water" ||
    tags.landuse === "reservoir" ||
    tags.waterway === "riverbank" ||
    tags.waterway === "dock" ||
    tags.waterway === "canal"
  ) {
    return "water";
  }

  return "green";
}

function toRing(points: OverpassPoint[] = []) {
  const ring = points.map((point) => [point.lat, point.lon] as [number, number]);

  if (ring.length < 4) {
    return null;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }

  return simplifyRing(ring);
}

function simplifyRing(ring: [number, number][]) {
  if (ring.length <= maxRingPoints) {
    return ring;
  }

  const stride = Math.ceil(ring.length / maxRingPoints);
  const simplified = ring.filter((_, index) => index % stride === 0);
  const first = simplified[0];
  const last = simplified[simplified.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    simplified.push(first);
  }

  return simplified;
}

function ringArea(ring: [number, number][]) {
  let area = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [latA, lngA] = ring[index];
    const [latB, lngB] = ring[index + 1];
    area += lngA * latB - lngB * latA;
  }

  return Math.abs(area) / 2;
}

function ringsFromElement(element: OverpassElement) {
  const rings: [number, number][][] = [];

  const ownRing = toRing(element.geometry);
  if (ownRing) {
    rings.push(ownRing);
  }

  for (const member of element.members ?? []) {
    if (member.role && member.role !== "outer") {
      continue;
    }

    const memberRing = toRing(member.geometry);
    if (memberRing) {
      rings.push(memberRing);
    }
  }

  return rings;
}

async function fetchFeatures() {
  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "WHEREgo/0.1 (Berlin map feature import)",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    throw new Error(`Overpass returned ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as OverpassResponse;
}

async function main() {
  console.log("Fetching Berlin parks, woods, rivers, lakes, and water areas...");

  const response = await fetchFeatures();
  const features: MapFeature[] = [];

  for (const element of response.elements) {
    const rings = ringsFromElement(element);

    if (rings.length === 0) {
      continue;
    }

    if (Math.max(...rings.map(ringArea)) < minRenderableArea) {
      continue;
    }

    features.push({
      id: `${element.type}/${element.id}`,
      kind: featureKind(element.tags),
      name: element.tags?.name,
      rings,
    });
  }

  features.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));

  const publicDataDir = path.join(process.cwd(), "public", "data");
  const outputPath = path.join(publicDataDir, "berlin-map-features.json");

  await mkdir(publicDataDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(features)}\n`, "utf8");

  const greenCount = features.filter((feature) => feature.kind === "green").length;
  const waterCount = features.filter((feature) => feature.kind === "water").length;

  console.log("Berlin map feature import complete");
  console.log(`Total fetched: ${response.elements.length}`);
  console.log(`Total normalized: ${features.length}`);
  console.log(`Green features: ${greenCount}`);
  console.log(`Water features: ${waterCount}`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to import Berlin map features");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
