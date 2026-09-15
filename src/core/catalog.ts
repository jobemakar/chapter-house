export type FurnitureKind =
  | "bookcase"
  | "table"
  | "sofa"
  | "chair"
  | "lamp"
  | "plant"
  | "bed"
  | "basket"
  | "doghouse"
  | "ornament";
export interface FurnitureDefinition {
  id: string;
  name: string;
  kind: FurnitureKind;
  width: number;
  depth: number;
  height: number;
  color: number;
  price?: number;
  gameReward?: string;
  description: string;
}
export const furniture: FurnitureDefinition[] = [
  {
    id: "library-shelf",
    name: "Story shelf",
    kind: "bookcase",
    width: 2.4,
    depth: 0.65,
    height: 2.5,
    color: 0x9a6346,
    description: "A home for well-loved stories",
  },
  {
    id: "reading-table",
    name: "Reading table",
    kind: "table",
    width: 2.1,
    depth: 1.2,
    height: 0.9,
    color: 0xb48052,
    description: "A spot to spread out a story",
  },
  {
    id: "sage-sofa",
    name: "Sage sofa",
    kind: "sofa",
    width: 2.3,
    depth: 1,
    height: 1.0,
    color: 0x709b89,
    description: "Soft cushions for daydreams",
  },
  {
    id: "cozy-chair",
    name: "Cozy chair",
    kind: "chair",
    width: 0.8,
    depth: 0.8,
    height: 1.1,
    color: 0xcc9871,
    price: 18,
    description: "Make a matching pair",
  },
  {
    id: "reading-lamp",
    name: "Reading lamp",
    kind: "lamp",
    width: 0.65,
    depth: 0.65,
    height: 1.9,
    color: 0xe8c16f,
    price: 24,
    description: "A little pool of golden light",
  },
  {
    id: "little-fern",
    name: "Little fern",
    kind: "plant",
    width: 0.65,
    depth: 0.65,
    height: 1.0,
    color: 0x5d9977,
    price: 12,
    description: "A leafy friend for your room",
  },
  {
    id: "wish-bed",
    name: "Patchwork dog bed",
    kind: "bed",
    width: 1.5,
    depth: 1.0,
    height: 0.35,
    color: 0xe0a566,
    gameReward: "bed",
    description: "Wishbone Fling · fourteen throws",
  },
  {
    id: "wish-basket",
    name: "Ball basket",
    kind: "basket",
    width: 0.75,
    depth: 0.75,
    height: 0.7,
    color: 0xc99a65,
    gameReward: "basket",
    description: "Wishbone Fling · four different toys",
  },
  {
    id: "wish-table",
    name: "Doghouse table",
    kind: "doghouse",
    width: 1.2,
    depth: 1,
    height: 1.15,
    color: 0xc88a62,
    gameReward: "table",
    description: "Wishbone Fling · all eight toys",
  },
  ...[
    { id: "sock", name: "Lucky sock", color: 0xe6a15f },
    { id: "squeaker", name: "Squeaky friend", color: 0xdd9079 },
    { id: "bandana", name: "Bandana display", color: 0xd8785c },
    { id: "power-bounce", name: "Bounce Biscuit display", color: 0xe6ac64 },
    { id: "power-magnet", name: "Magnet Bandana display", color: 0x85bdb0 },
    { id: "power-wind", name: "Tailwind Pinwheel display", color: 0xb8a3ce },
  ].map((p) => ({
    id: "wish-" + p.id,
    name: p.name,
    kind: "ornament" as const,
    width: 0.55,
    depth: 0.55,
    height: 0.7,
    color: p.color,
    gameReward: p.id,
    description: "A special Wishbone Fling keepsake",
  })),
];
export interface PetDefinition {
  id: string;
  name: string;
  color: number;
  accent: number;
  starter: boolean;
  price: number;
  shape: "cat" | "bunny" | "fox";
}
export const pets: PetDefinition[] = [
  {
    id: "cat",
    name: "Clover the cat",
    color: 0xdec09a,
    accent: 0xf7dfbc,
    starter: true,
    price: 60,
    shape: "cat",
  },
  {
    id: "bunny",
    name: "Pip the bunny",
    color: 0xdcd4c9,
    accent: 0xf5e9d6,
    starter: true,
    price: 60,
    shape: "bunny",
  },
  {
    id: "fox",
    name: "Fig the fox",
    color: 0xd88b55,
    accent: 0xffedce,
    starter: false,
    price: 90,
    shape: "fox",
  },
];
export const getFurniture = (id: string) =>
  furniture.find((item) => item.id === id);
export const getPet = (id: string) => pets.find((pet) => pet.id === id);
