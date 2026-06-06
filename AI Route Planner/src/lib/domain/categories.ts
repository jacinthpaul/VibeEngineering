// Attraction category taxonomy from the PRD, grouped for the UI.

export interface CategoryDef {
  id: string;
  label: string;
}

export interface CategoryGroup {
  id: string;
  label: string;
  items: CategoryDef[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "nature",
    label: "Nature",
    items: [
      { id: "waterfalls", label: "Waterfalls" },
      { id: "lakes", label: "Lakes" },
      { id: "dams", label: "Dams" },
      { id: "forests", label: "Forests" },
    ],
  },
  {
    id: "scenic",
    label: "Scenic",
    items: [
      { id: "viewpoints", label: "Viewpoints" },
      { id: "sunset_points", label: "Sunset Points" },
      { id: "sunrise_points", label: "Sunrise Points" },
    ],
  },
  {
    id: "historical",
    label: "Historical",
    items: [
      { id: "forts", label: "Forts" },
      { id: "palaces", label: "Palaces" },
      { id: "monuments", label: "Monuments" },
    ],
  },
  {
    id: "religious",
    label: "Religious",
    items: [
      { id: "temples", label: "Temples" },
      { id: "churches", label: "Churches" },
      { id: "mosques", label: "Mosques" },
    ],
  },
  {
    id: "adventure",
    label: "Adventure",
    items: [
      { id: "trekking", label: "Trekking" },
      { id: "river_rafting", label: "River Rafting" },
      { id: "camping", label: "Camping" },
    ],
  },
  {
    id: "food",
    label: "Food",
    items: [
      { id: "restaurants", label: "Famous Restaurants" },
      { id: "local_specialties", label: "Local Specialties" },
      { id: "cafes", label: "Cafes" },
    ],
  },
  {
    id: "photography",
    label: "Photography",
    items: [{ id: "instagram_spots", label: "Instagram-worthy Spots" }],
  },
];

export const ALL_CATEGORY_IDS: string[] = CATEGORY_GROUPS.flatMap((g) =>
  g.items.map((i) => i.id),
);

const LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label])),
);

export function categoryLabel(id: string): string {
  return LABELS[id] ?? id;
}
