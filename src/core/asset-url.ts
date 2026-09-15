/** Resolve packaged public assets under both localhost and sub-path hosting. */
export const assetUrl = (path: string): string =>
  `${import.meta.env?.BASE_URL ?? "/"}assets/${path.replace(/^\/+/, "")}`;
