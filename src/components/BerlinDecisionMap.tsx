"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  ArrowUpRight,
  Home,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Minus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type Coordinates = {
  lat: number;
  lng: number;
};

type OriginMode = "city" | "live" | "manual";

type RecommendedPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  cuisine?: string[];
  openingHours?: string;
  distanceKm: number;
  distance: string;
  score: number;
  vibe: string[];
  price: "€" | "€€" | "€€€";
  reason: string;
};

type MapPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  cuisine?: string[];
  openingHours?: string;
};

type PlaceDecision = {
  origin: Coordinates;
  originMode: OriginMode;
  radiusKm: number;
  places: RecommendedPlace[];
  attribution: string;
};

const berlinCenter: Coordinates = {
  lat: 52.52,
  lng: 13.405,
};

const initialQuery = "quiet cafe for studying";
const initialDecision: PlaceDecision = {
  origin: berlinCenter,
  originMode: "city",
  radiusKm: 2,
  places: [],
  attribution: "Place data © OpenStreetMap contributors",
};

const categoryGroups = {
  all: ["cafe", "coffee_shop", "restaurant"],
  cafe: ["cafe", "coffee_shop"],
  restaurant: ["restaurant"],
  bakery: ["bakery"],
  more: ["bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream"],
} as const;

type CategoryGroup = keyof typeof categoryGroups;

const categoryPills: { id: CategoryGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cafe", label: "Cafe" },
  { id: "restaurant", label: "Restaurant" },
  { id: "bakery", label: "Bakery" },
  { id: "more", label: "More" },
];

const categoryColors: Record<string, { pin: string; glow: string }> = {
  cafe: { pin: "#FF7A00", glow: "rgba(255, 122, 0, 0.38)" },
  coffee_shop: { pin: "#FF9A1F", glow: "rgba(255, 154, 31, 0.36)" },
  restaurant: { pin: "#E11D24", glow: "rgba(225, 29, 36, 0.38)" },
  fast_food: { pin: "#FF8A00", glow: "rgba(255, 138, 0, 0.34)" },
  food_court: { pin: "#FF8A00", glow: "rgba(255, 138, 0, 0.34)" },
  bar: { pin: "#C9141B", glow: "rgba(201, 20, 27, 0.34)" },
  pub: { pin: "#C9141B", glow: "rgba(201, 20, 27, 0.34)" },
  biergarten: { pin: "#0F5A2A", glow: "rgba(15, 90, 42, 0.34)" },
  bakery: { pin: "#F5C542", glow: "rgba(245, 197, 66, 0.34)" },
  ice_cream: { pin: "#FF9A1F", glow: "rgba(255, 154, 31, 0.34)" },
  dessert: { pin: "#FF9A1F", glow: "rgba(255, 154, 31, 0.34)" },
};

function createPinIcon(place: RecommendedPlace, rank: number) {
  const size = rank === 0 ? 46 : 34;
  const style = categoryColors[place.category] ?? {
    pin: "#FF7A00",
    glow: "rgba(255, 122, 0, 0.34)",
  };
  const background =
    rank === 0 ? "linear-gradient(135deg, #E11D24 0%, #FF7A00 100%)" : style.pin;

  return L.divIcon({
    className: "wherego-pin",
    html: `
      <button
        aria-label="${place.name}"
        class="wherego-pin-button"
        style="width:${size}px;height:${size}px;background:${background};box-shadow:0 0 0 8px ${style.glow}, 0 0 24px rgba(255,122,0,.38), 0 14px 28px rgba(0,0,0,.48);"
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

function createNavigateUrl(place: RecommendedPlace) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name} ${place.lat},${place.lng}`,
  )}`;
}

function toRecommendedPlace(place: MapPlace): RecommendedPlace {
  return {
    ...place,
    distanceKm: 0,
    distance: "Berlin",
    score: 0,
    vibe: [place.category.replaceAll("_", " ")],
    price: place.category === "restaurant" ? "€€" : "€",
    reason: "OpenStreetMap place shown on the Berlin coffee and restaurant layer.",
  };
}

function RecenterMap({ decision }: { decision: PlaceDecision }) {
  const map = useMap();

  useEffect(() => {
    if (decision.places.length === 0) {
      map.setView([decision.origin.lat, decision.origin.lng], 13);
      return;
    }

    const bounds = L.latLngBounds([
      [decision.origin.lat, decision.origin.lng] as [number, number],
      ...decision.places.map((place) => [place.lat, place.lng] as [number, number]),
    ]);
    map.fitBounds(bounds, { padding: [82, 82], maxZoom: 15 });
  }, [decision, map]);

  return null;
}

function CityPlaceLayer({
  places,
  onSelect,
}: {
  places: MapPlace[];
  onSelect: (place: RecommendedPlace) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.5 });
    const layer = L.layerGroup().addTo(map);

    for (const place of places) {
      const color = categoryColors[place.category]?.pin ?? "#FF7A00";
      const marker = L.circleMarker([place.lat, place.lng], {
        renderer,
        radius: place.category === "restaurant" ? 3.8 : 3.3,
        color: "rgba(255,255,255,0.86)",
        weight: 0.7,
        fillColor: color,
        fillOpacity: 0.84,
        opacity: 0.72,
      });

      marker.on("click", () => onSelect(toRecommendedPlace(place)));
      marker.addTo(layer);
    }

    return () => {
      layer.remove();
    };
  }, [map, onSelect, places]);

  return null;
}

function MapControls({
  manualPinMode,
  onToggleManualPinMode,
  onUseLiveLocation,
}: {
  manualPinMode: boolean;
  onToggleManualPinMode: () => void;
  onUseLiveLocation: () => void;
}) {
  const map = useMap();

  return (
    <div className="pointer-events-auto absolute right-4 top-36 z-[520] flex flex-col gap-3 sm:right-6">
      <button
        type="button"
        className="grid h-12 w-12 place-items-center rounded-full border border-[#2A2A2A] bg-[#0B0B0B] text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition hover:border-[#E11D24]"
        aria-label="Zoom in"
        onClick={() => map.zoomIn()}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="grid h-12 w-12 place-items-center rounded-full border border-[#2A2A2A] bg-[#0B0B0B] text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition hover:border-[#E11D24]"
        aria-label="Zoom out"
        onClick={() => map.zoomOut()}
      >
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="grid h-12 w-12 place-items-center rounded-full border border-[#2A2A2A] bg-[#0B0B0B] text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition hover:border-[#E11D24]"
        aria-label="Use my location"
        onClick={onUseLiveLocation}
      >
        <Navigation className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`grid h-12 w-12 place-items-center rounded-full border text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition ${
          manualPinMode
            ? "border-[#FF7A00] bg-[linear-gradient(135deg,#E11D24_0%,#FF7A00_100%)] shadow-[0_0_24px_rgba(255,122,0,0.35)]"
            : "border-[#2A2A2A] bg-[#0B0B0B] hover:border-[#E11D24]"
        }`}
        aria-label="Toggle manual pin mode"
        aria-pressed={manualPinMode}
        onClick={onToggleManualPinMode}
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

function OriginPicker({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (origin: Coordinates, mode: OriginMode) => void;
}) {
  useMapEvents({
    click(event) {
      if (enabled) {
        onPick({ lat: event.latlng.lat, lng: event.latlng.lng }, "manual");
      }
    },
    contextmenu(event) {
      if (enabled) {
        onPick({ lat: event.latlng.lat, lng: event.latlng.lng }, "manual");
      }
    },
  });

  return null;
}

export default function BerlinDecisionMap() {
  const [query, setQuery] = useState(initialQuery);
  const [decision, setDecision] = useState<PlaceDecision>(initialDecision);
  const [origin, setOrigin] = useState<Coordinates>(berlinCenter);
  const [originMode, setOriginMode] = useState<OriginMode>("city");
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(null);
  const [cityPlaces, setCityPlaces] = useState<MapPlace[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryGroup>("all");
  const [manualPinMode, setManualPinMode] = useState(true);
  const [isDeciding, setIsDeciding] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Manual pin mode is on, click the map to plan anywhere",
  );

  const topPlace = useMemo(() => decision.places[0] ?? null, [decision.places]);
  const cityPlaceCount = cityPlaces.length;

  async function decide(
    nextQuery = query,
    nextOrigin = origin,
    nextOriginMode = originMode,
  ) {
    setIsDeciding(true);

    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: nextQuery,
        origin: nextOrigin,
        radiusKm: 2,
      }),
    });
    const nextDecision = (await response.json()) as Omit<PlaceDecision, "originMode">;
    const withMode = { ...nextDecision, originMode: nextOriginMode };

    setDecision(withMode);
    setSelectedPlace(withMode.places[0] ?? null);
    setIsDeciding(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void decide(initialQuery, berlinCenter, "city");
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCityPlaces() {
      const responses = await Promise.all(
        categoryGroups[activeCategory].map((category) =>
          fetch(`/api/places?category=${category}&limit=5000`, {
            signal: controller.signal,
          }).then((response) => response.json() as Promise<{ places: MapPlace[] }>),
        ),
      );
      const uniquePlaces = new Map<string, MapPlace>();

      for (const response of responses) {
        for (const place of response.places) {
          uniquePlaces.set(place.id, place);
        }
      }

      setCityPlaces([...uniquePlaces.values()]);
    }

    void loadCityPlaces().catch((error) => {
      if ((error as Error).name !== "AbortError") {
        console.error(error);
      }
    });

    return () => controller.abort();
  }, [activeCategory]);

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
    const nextQuery = "best places in Berlin";
    setQuery(nextQuery);
    setOrigin(berlinCenter);
    setOriginMode("city");
    setLocationMessage("Berlin center is now the search origin");
    void decide(nextQuery, berlinCenter, "city");
  }

  function toggleManualPinMode() {
    setManualPinMode((current) => {
      const next = !current;
      setLocationMessage(
        next
          ? "Manual pin mode is on, click the map to plan anywhere"
          : "Manual pin mode is off",
      );
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void decide();
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#050505] text-white">
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
        <OriginPicker enabled={manualPinMode} onPick={selectOrigin} />
        <CityPlaceLayer places={cityPlaces} onSelect={setSelectedPlace} />
        <MapControls
          manualPinMode={manualPinMode}
          onToggleManualPinMode={toggleManualPinMode}
          onUseLiveLocation={useLiveLocation}
        />
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

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-black/78 via-black/18 to-transparent px-4 pb-12 pt-5 sm:px-6">
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center gap-3 pr-14 sm:pr-0">
          <form
            onSubmit={handleSubmit}
            className="flex min-h-14 flex-1 items-center gap-3 rounded-full border border-[#E11D24] bg-[#050505]/92 px-4 shadow-[0_0_24px_rgba(225,29,36,0.20),0_16px_36px_rgba(0,0,0,0.46)] backdrop-blur-xl"
          >
            <Search className="h-5 w-5 shrink-0 text-[#C9C9C9]" aria-hidden="true" />
            <label htmlFor="wherego-search" className="sr-only">
              Search in WHEREgo
            </label>
            <input
              id="wherego-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in WHEREgo..."
              dir="auto"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#8A8A8A]"
            />
            <button
              type="submit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#E11D24_0%,#FF7A00_100%)] text-white shadow-[0_0_24px_rgba(255,122,0,0.35)] transition hover:scale-105"
              aria-label="Ask WHEREgo"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full border border-[#2A2A2A] bg-[#0B0B0B]/92 backdrop-blur-xl transition hover:border-[#E11D24]"
              aria-label="Use live location"
              onClick={useLiveLocation}
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full border border-[#2A2A2A] bg-[#0B0B0B]/92 backdrop-blur-xl transition hover:border-[#E11D24]"
              aria-label="Reset to Berlin"
              onClick={resetToBerlin}
            >
              <LocateFixed className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pointer-events-auto mx-auto mt-3 flex w-full max-w-3xl gap-2 overflow-x-auto pr-14 [scrollbar-width:none] sm:pr-0">
          {categoryPills.map((pill) => {
            const isActive = activeCategory === pill.id;

            return (
              <button
                key={pill.id}
                type="button"
                className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#E11D24_0%,#FF7A00_100%)] text-white shadow-[0_0_20px_rgba(255,122,0,0.35)]"
                    : "border border-[#2A2A2A] bg-[#0B0B0B]/92 text-white hover:border-[#E11D24]"
                }`}
                aria-pressed={isActive}
                onClick={() => setActiveCategory(pill.id)}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-auto mx-auto mt-3 flex w-full max-w-3xl items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#0B0B0B]/84 px-4 py-2 text-xs text-[#C9C9C9] backdrop-blur-xl">
          <MapPin className="h-4 w-4 shrink-0 text-[#FF7A00]" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {locationMessage} · {decision.radiusKm} km radius · {cityPlaceCount.toLocaleString()} coffee and restaurant pins
          </span>
        </div>
      </div>

      <nav
        className="pointer-events-auto absolute bottom-5 left-1/2 z-[540] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#E11D24] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        aria-label="Main navigation"
      >
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full text-white/82 transition hover:bg-black/20"
          aria-label="Profile"
        >
          <span className="text-sm font-bold">P</span>
        </button>
        <button
          type="button"
          className="grid h-11 min-w-14 place-items-center rounded-full bg-[#050505] px-4 text-white"
          aria-label="Map search active"
          aria-current="page"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full text-white/82 transition hover:bg-black/20"
          aria-label="Home"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>

      <section className="pointer-events-none absolute inset-x-0 bottom-24 z-[500] px-3 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="pointer-events-auto overflow-hidden rounded-t-[28px] border border-[#2A2A2A] bg-[#0B0B0B]/96 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:rounded-[28px]">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/22" />
            {selectedPlace ? (
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8A8A8A]">
                      <span>
                        #
                        {decision.places.findIndex(
                          (place) => place.id === selectedPlace.id,
                        ) + 1}
                      </span>
                      <span>{selectedPlace.category.replaceAll("_", " ")}</span>
                      <span>{selectedPlace.distance}</span>
                    </div>
                    <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                      {selectedPlace.name}
                    </h1>
                    {selectedPlace.address ? (
                      <p className="mt-2 text-sm text-[#C9C9C9]">{selectedPlace.address}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#181818] text-[#C9C9C9] transition hover:bg-[#2A2A2A] hover:text-white"
                    aria-label="Close place details"
                    onClick={() => setSelectedPlace(null)}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[linear-gradient(135deg,#E11D24_0%,#FF7A00_100%)] px-3 py-1 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,122,0,0.28)]">
                    {selectedPlace.price}
                  </span>
                  {selectedPlace.cuisine?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#2A2A2A] bg-[#181818] px-3 py-1 text-sm text-[#C9C9C9]"
                    >
                      {tag}
                    </span>
                  ))}
                  {selectedPlace.vibe.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#2A2A2A] bg-[#181818] px-3 py-1 text-sm text-[#C9C9C9]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="mb-4 text-sm leading-6 text-[#C9C9C9] sm:text-base">
                  {selectedPlace.reason}
                </p>

                <div className="mb-5 grid gap-1 text-sm text-[#8A8A8A]">
                  {selectedPlace.openingHours ? (
                    <span>{selectedPlace.openingHours}</span>
                  ) : null}
                  {selectedPlace.phone ? <span>{selectedPlace.phone}</span> : null}
                  {selectedPlace.website ? (
                    <a
                      href={selectedPlace.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[#FF9A1F] underline decoration-[#FF7A00]/40 underline-offset-4"
                    >
                      {selectedPlace.website}
                    </a>
                  ) : null}
                </div>

                <a
                  href={createNavigateUrl(selectedPlace)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#E11D24_0%,#FF7A00_100%)] text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,122,0,0.35)] transition hover:scale-[1.01] sm:w-auto sm:px-6"
                >
                  Navigate
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => topPlace && setSelectedPlace(topPlace)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[#181818] sm:p-6"
              >
                <span>
                  <span className="block text-sm font-medium text-[#8A8A8A]">
                    {isDeciding
                      ? "AI is choosing Berlin pins"
                      : "Run the importer, then drop a pin or search"}
                  </span>
                  <span className="mt-1 block text-lg font-semibold text-white">
                    {topPlace?.name ?? "WHEREgo Berlin"}
                  </span>
                </span>
                <Sparkles className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
              </button>
            )}
            <div className="border-t border-[#2A2A2A] px-5 py-3 text-[11px] text-[#8A8A8A] sm:px-6">
              {decision.attribution}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
