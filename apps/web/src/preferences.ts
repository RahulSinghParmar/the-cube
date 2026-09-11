export const DEFAULT_KEYS: Record<string, string> = {
  U: "j",
  "U'": "f",
  R: "i",
  "R'": "k",
  L: "d",
  "L'": "e",
  F: "h",
  "F'": "g",
  B: "w",
  "B'": "o",
  D: "s",
  "D'": "l",
};
export interface Preferences {
  theme: "light" | "dark" | "contrast";
  locale: "en" | "hi";
  reducedMotion: boolean;
  labels: boolean;
  keys: Record<string, string>;
}
export function defaultPreferences(): Preferences {
  return {
    theme: "light",
    locale: "en",
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    labels: false,
    keys: { ...DEFAULT_KEYS },
  };
}
export function validatePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object")
    throw new Error("Invalid preferences");
  const p = value as Preferences;
  if (
    !["light", "dark", "contrast"].includes(p.theme) ||
    !["en", "hi"].includes(p.locale) ||
    typeof p.reducedMotion !== "boolean" ||
    typeof p.labels !== "boolean" ||
    !p.keys ||
    Object.keys(p.keys).length !== 12
  )
    throw new Error("Unsupported preferences");
  const used = new Set<string>();
  for (const move of Object.keys(DEFAULT_KEYS)) {
    const key = p.keys[move];
    if (
      typeof key !== "string" ||
      !/^[a-z]$/.test(key) ||
      "xyz".includes(key) ||
      used.has(key)
    )
      throw new Error(
        "Use twelve different letters. X, Y and Z are reserved for cube rotation.",
      );
    used.add(key);
  }
  return {
    theme: p.theme,
    locale: p.locale,
    reducedMotion: p.reducedMotion,
    labels: p.labels,
    keys: { ...p.keys },
  };
}
