"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { ArrowUpRight, LocateFixed, Search, Sparkles, X } from "lucide-react";
import { decideBerlinPlaces } from "@/lib/places";
import type { Place, PlaceDecision, PlaceVibe } from "@/lib/places";

const vibeStyles: Record<PlaceVibe, { pin: string; glow: string }> = {
  study: { pin: "#38bdf8", glow: "rgba(56, 189, 248, 0.34)" },
  food: { pin: "#ef4444", glow: "rgba(239, 68, 68, 0.34)" },
  date: { pin: "#ec4899", glow: "rgba(236, 72, 153, 0.34)" },
  casual: { pin: "#22c55e", glow: "rgba(34, 197, 94, 0.34)" },
};

const initialQuery = "date night in Berlin";
const initialDecision = decideBerlinPlaces(initialQuery);

function createPinIcon(place: Place, rank: number) {
  const size = rank === 0 ? 58 : 44;
  const style = vibeStyles[place.primaryVibe];

  return L.divIcon({
    className: "wherego-pin",
    html: `
      <button
        aria-label="${place.name}"
        class="wherego-pin-button"
        style="width:${size}px;height:${size}px;background:${style.pin};box-shadow:0 0 0 10px ${style.glow}, 0 16px 32px rgba(0,0,0,.42);"
      >
        <span>${rank + 1}</span>
      </button>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function RecenterMap({ decision }: { decision: PlaceDecision }) {
  const map = useMap();

  useEffect(() => {
    if (decision.places.length === 0) {
      map.setView([decision.center.lat, decision.center.lng], 13);
      return;
    }

    const bounds = L.latLngBounds(
      decision.places.map((place) => [place.lat, place.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [74, 74], maxZoom: 14 });
  }, [decision, map]);

  return null;
}

export default function BerlinDecisionMap() {
  const [query, setQuery] = useState(initialQuery);
  const [decision, setDecision] = useState<PlaceDecision>(initialDecision);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(
    initialDecision.places[0] ?? null,
  );
  const [isDeciding, setIsDeciding] = useState(false);

  const topPlace = useMemo(() => decision.places[0] ?? null, [decision.places]);

  async function decide(nextQuery = query) {
    setIsDeciding(true);

    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: nextQuery }),
    });
    const nextDecision = (await response.json()) as PlaceDecision;

    setDecision(nextDecision);
    setSelectedPlace(nextDecision.places[0] ?? null);
    setIsDeciding(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void decide();
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#08110f] text-white">
      <MapContainer
        center={[initialDecision.center.lat, initialDecision.center.lng]}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <RecenterMap decision={decision} />
        {decision.places.map((place, index) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={createPinIcon(place, index)}
            eventHandlers={{
              click: () => setSelectedPlace(place),
            }}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-black/72 via-black/18 to-transparent px-4 pb-12 pt-4 sm:px-6">
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center gap-3">
          <form
            onSubmit={handleSubmit}
            className="flex min-h-14 flex-1 items-center gap-3 rounded-[28px] border border-white/12 bg-black/72 px-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <Search className="h-5 w-5 shrink-0 text-white/64" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="cheap food nearby"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/42"
            />
            <button
              type="submit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-black transition hover:scale-105"
              aria-label="Ask WHEREgo"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          <button
            type="button"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/12 bg-black/68 backdrop-blur-xl transition hover:bg-black/82"
            aria-label="Center Berlin"
            onClick={() => void decide("best places in Berlin")}
          >
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-2xl">
          <div className="pointer-events-auto overflow-hidden rounded-t-[28px] border border-white/12 bg-[#0b0d0c]/92 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:rounded-[28px]">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/22" />
            {selectedPlace ? (
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/50">
                      <span>
                        #
                        {decision.places.findIndex(
                          (place) => place.id === selectedPlace.id,
                        ) + 1}
                      </span>
                      <span>{selectedPlace.category}</span>
                      <span>{selectedPlace.distance}</span>
                    </div>
                    <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                      {selectedPlace.name}
                    </h1>
                  </div>
                  <button
                    type="button"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/14 hover:text-white"
                    aria-label="Close place details"
                    onClick={() => setSelectedPlace(null)}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-black">
                    {selectedPlace.price}
                  </span>
                  {selectedPlace.vibe.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-sm text-white/78"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="mb-5 text-sm leading-6 text-white/72 sm:text-base">
                  {selectedPlace.reason}
                </p>

                <a
                  href={selectedPlace.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition hover:scale-[1.01] sm:w-auto sm:px-6"
                >
                  Navigate
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => topPlace && setSelectedPlace(topPlace)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/5 sm:p-6"
              >
                <span>
                  <span className="block text-sm font-medium text-white/54">
                    {isDeciding ? "AI is choosing Berlin pins" : "Tap a pin for the best match"}
                  </span>
                  <span className="mt-1 block text-lg font-semibold text-white">
                    {topPlace?.name ?? "WHEREgo Berlin"}
                  </span>
                </span>
                <Sparkles className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
