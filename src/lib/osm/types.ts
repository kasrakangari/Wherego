import type { PlaceCategory } from "@/lib/places/categories";

export type OsmElementType = "node" | "way" | "relation";

export type OverpassElement = {
  type: OsmElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  elements: OverpassElement[];
};

export interface Place {
  id: string;
  source: "osm";
  osmId: string;
  osmType: OsmElementType;

  name: string;
  category: PlaceCategory;

  lat: number;
  lng: number;

  address?: string;
  street?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;

  phone?: string;
  website?: string;
  email?: string;

  cuisine?: string[];
  openingHours?: string;

  wheelchair?: string;
  outdoorSeating?: boolean;
  takeaway?: boolean;
  delivery?: boolean;

  tags: string[];

  rawTags: Record<string, string>;

  createdAt: string;
  updatedAt: string;
}
