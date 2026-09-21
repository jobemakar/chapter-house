/** Free fur colors are saved as their exact hex values for v1 compatibility. */
export const AVATAR_COLOR_CATALOG = [
  { value: "#cc8957", name: "Autumn" },
  { value: "#8e9eae", name: "Slate" },
  { value: "#d3ad85", name: "Honey" },
  { value: "#af96b3", name: "Lilac" },
  { value: "#e7dfd2", name: "Cream" },
  { value: "#765348", name: "Cocoa" },
  { value: "#718267", name: "Moss" },
  { value: "#c9818c", name: "Rose" },
  { value: "#4f566e", name: "Midnight" },
  { value: "#568b86", name: "Teal" },
] as const;
export type AvatarColor = (typeof AVATAR_COLOR_CATALOG)[number]["value"];
export const AVATAR_COLOR_VALUES = AVATAR_COLOR_CATALOG.map(
  ({ value }) => value,
) as readonly AvatarColor[];

export function normalizeAvatarColor(value: unknown): AvatarColor {
  return AVATAR_COLOR_VALUES.includes(value as AvatarColor)
    ? (value as AvatarColor)
    : "#cc8957";
}

export function avatarColorName(color: AvatarColor): string {
  return AVATAR_COLOR_CATALOG.find((entry) => entry.value === color)!.name;
}
