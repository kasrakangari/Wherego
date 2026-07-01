"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { ArrowUpRight, LocateFixed, MapPin, Navigation, Search, Sparkles, X } from "lucide-react";
import { berlinCenter, decideBerlinPlaces } from "@/lib/places";
import type { Coordinates, OriginMode, Place, PlaceDecision, PlaceVibe } from "@/lib/places";

const vibeStyles: Record<PlaceVibe, { pin: string; glow: string }> = {
  study: { pin: "#38bdf8", glow: "rgba(56, 189, 248, 0.34)" },
  food: { pin: "#ef4444", glow: "rgba(239, 68, 68, 0.34)" },
  date: { pin: "#ec4899", glow: "rgba(236, 72, 153, 0.34)" },
  casual: { pin: "#22c55e", glow: "rgba(34, 197, 94, 0.34)" },
};

const initialQuery = "date night in Berlin";
const initialDecision = decideBerlinPlaces(initialQuery, berlinCenter, "city", 5);

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

function createOriginIcon(mode: OriginMode) {
  const isLive = mode === "live";

  return L.divIcon({
    className: "wherego-origin",
    html: `
      <div class="wherego-origin-pin ${isLive ? "wherego-origin-live" : ""}">
        <span></span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function RecenterMap({ decision }: { decision: PlaceDecision }) {
  const map = useMap();

  useEffect(() => {
    if (decision.places.length === 0) {
      map.setView([decision.origin.lat, decision.origin.lng], 13);
      return;
    }

    const bounds = L.latLngBounds(
      [
        [decision.origin.lat, decision.origin.lng] as [number, number],
        ...decision.places.map((place) => [place.lat, place.lng] as [number, number]),
      ],
    );
    map.fitBounds(bounds, { padding: [82, 82], maxZoom: 14 });
  }, [decision, map]);

  return null;
}

function OriginPicker({
  onPick,
}: {
  onPick: (origin: Coordinates, mode: OriginMode) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng }, "manual");
    },
    contextmenu(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng }, "manual");
    },
  });

  return null;
}

export default function BerlinDecisionMap() {
  const [query, setQuery] = useState(initialQuery);
  const [decision, setDecision] = useState<PlaceDecision>(initialDecision);
  const [origin, setOrigin] = useState<Coordinates>(initialDecision.origin);
  const [originMode, setOriginMode] = useState<OriginMode>("city");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(
    initialDecision.places[0] ?? null,
  );
  const [isDeciding, setIsDeciding] = useState(false);
  const [locationMessage, setLocationMessage] = useState("Click the map to drop a planning pin");

  const topPlace = useMemo(() => decision.places[0] ?? null, [decision.places]);

  async function decide(
    nextQuery = query,
    nextOrigin = origin,
    nextOriginMode = originMode,
  ) {
    setIsDeciding(true);

    const response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: nextQuery,
        origin: nextOrigin,
        originMode: nextOriginMode,
        radiusKm: 5,
      }),
    });
    const nextDecision = (await response.json()) as PlaceDecision;

    setDecision(nextDecision);
    setSelectedPlace(nextDecision.places[0] ?? null);
    setIsDeciding(false);
  }

  function selectOrigin(nextOrigin: Coordinates, nextOriginMode: OriginMode) {
    setOrigin(nextOrigin);
    setOriginMode(nextOriginMode);
    setLocationMessage(
      nextOriginMode === "live"
        ? "Using your live location as the search origin"
        : "Manual pin is now the search origin",
    );
    void decide(query, nextOrigin, nextOriginMode);
  }

  function useLiveLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Live location is not available in this browser");
      return;
    }

    setLocationMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectOrigin(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          "live",
        );
      },
      () => {
        setLocationMessage("Location permission was blocked, use a manual pin");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  function resetToBerlin() {
    setQuery("best places in Berlin");
    selectOrigin(berlinCenter, "city");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void decide();
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#08110f] text-white">
      <MapContainer
        center={[initialDecision.origin.lat, initialDecision.origin.lng]}
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
        <OriginPicker onPick={selectOrigin} />
        <Marker
          position={[decision.origin.lat, decision.origin.lng]}
          icon={createOriginIcon(decision.originMode)}
        />
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
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-black/68 backdrop-blur-xl transition hover:bg-black/82"
              aria-label="Use live location"
              onClick={useLiveLocation}
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-black/68 backdrop-blur-xl transition hover:bg-black/82"
              aria-label="Reset to Berlin"
              onClick={resetToBerlin}
            >
              <LocateFixed className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pointer-events-auto mx-auto mt-3 flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/68 backdrop-blur-xl">
          <MapPin className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {locationMessage} · {decision.radiusKm} km radius · {decision.originMode} mode
          </span>
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
