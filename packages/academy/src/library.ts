import {
  apply,
  parseMove,
  solved,
  validate3x3,
  type CubeState,
} from "@the-cube/cube-core";
import {
  PLL_CASES,
  PLL_GROUPS,
  PLL_EXPLANATIONS,
  PLL_SOURCE,
  pllPieceGuide,
  verifyPLL,
} from "./pll.js";
import {
  OLL_CASES,
  OLL_GROUPS,
  OLL_EXPLANATIONS,
  OLL_SOURCE,
  ollName,
  ollOrientationGuide,
  verifyOLL,
} from "./oll.js";
import {
  F2L_CASES,
  F2L_GROUPS,
  F2L_SOURCE,
  f2lPairGuide,
  verifyF2L,
} from "./f2l.js";

export type Collection = "PLL" | "OLL" | "F2L";
export const RATINGS = ["new", "learning", "comfortable"] as const;
export type Rating = (typeof RATINGS)[number];
export interface AlgorithmVariant {
  id: "standard" | "reference";
  name: string;
  algorithm: string;
}
export interface LibraryCase {
  id: string;
  collection: Collection;
  name: string;
  group: string;
  explanation: string;
  facelets: string;
  source: string;
  goal: string;
  variants: AlgorithmVariant[];
}
// Explicitly qualified original-notation variants. Other reference sequences need
// orientation adaptation before they can be used on these exact saved fixtures.
const referenceVariants = new Set([
  "H",
  "Z",
  "Aa",
  "Ab",
  "E",
  "OLL2",
  "OLL3",
  "OLL4",
  "OLL5",
  "OLL6",
  "OLL7",
  "OLL8",
  "OLL11",
  "OLL12",
  "OLL15",
  "OLL16",
  "OLL19",
  "OLL20",
  "OLL24",
  "OLL28",
  "OLL36",
  "OLL44",
  "OLL49",
  "OLL50",
  "OLL51",
  "OLL53",
  "OLL54",
  "OLL56",
  "OLL57",
]);
function variants(item: {
  id: string;
  algorithm: string;
  referenceAlgorithm?: string;
}): AlgorithmVariant[] {
  const result: AlgorithmVariant[] = [
    {
      id: "standard",
      name: "Face turns · trainer version",
      algorithm: item.algorithm,
    },
  ];
  if (referenceVariants.has(item.id) && item.referenceAlgorithm)
    result.push({
      id: "reference",
      name: "Reference notation · slices / wide turns / rotations",
      algorithm: item.referenceAlgorithm,
    });
  return result;
}
export const LIBRARY: LibraryCase[] = [
  ...PLL_CASES.map((item) => ({
    ...item,
    collection: "PLL" as const,
    name: `${item.id} permutation`,
    group: PLL_GROUPS[item.group],
    explanation: PLL_EXPLANATIONS[item.group],
    source: PLL_SOURCE,
    goal: "Put every last-layer piece in its home position. Both lower layers and the oriented top must be restored.",
    variants: variants(item),
  })),
  ...OLL_CASES.map((item) => ({
    ...item,
    collection: "OLL" as const,
    name: ollName(item.id),
    group: OLL_GROUPS[item.group],
    explanation: OLL_EXPLANATIONS[item.group],
    source: OLL_SOURCE,
    goal: "Make the whole top face white while restoring the lower layers. Side colors can still need PLL afterward.",
    variants: variants(item),
  })),
  ...F2L_CASES.map((item) => ({
    ...item,
    collection: "F2L" as const,
    name: item.title,
    group: F2L_GROUPS[item.group],
    source: F2L_SOURCE,
    goal: "Insert the yellow–green–red corner and green–red edge in the front-right slot. Restore the cross and other pairs; the last layer remains unsolved.",
    variants: variants(item),
  })),
];
export function libraryCase(id: string): LibraryCase {
  const item = LIBRARY.find((item) => item.id === id);
  if (!item) throw new Error("Unknown catalog case.");
  return item;
}
export function libraryInput(item: LibraryCase): CubeState {
  return { ...solved(3), facelets: item.facelets };
}
export function recognitionCues(item: LibraryCase): string[] {
  if (item.collection === "PLL")
    return pllPieceGuide(item.id).map(
      (piece) => `The ${piece.from} belongs at the ${piece.to}.`,
    );
  if (item.collection === "OLL") return ollOrientationGuide(item.id);
  return f2lPairGuide(libraryInput(item));
}
export function verifyLibraryCase(id: string): void {
  const item = libraryCase(id);
  ({ PLL: verifyPLL, OLL: verifyOLL, F2L: verifyF2L })[item.collection](id);
  const input = validate3x3(libraryInput(item));
  const run = (algorithm: string) =>
    algorithm
      .split(/\s+/)
      .reduce((state, move) => apply(state, parseMove(move, 3)), input);
  const target = run(item.variants[0]!.algorithm).facelets;
  for (const variant of item.variants)
    if (run(variant.algorithm).facelets !== target)
      throw new Error(
        "Variant does not match the verified fixture and orientation.",
      );
}
export interface CasePreference {
  favorite: boolean;
  rating: Rating;
  preferred: "auto" | "standard" | "reference";
  variants: Partial<Record<AlgorithmVariant["id"], Rating>>;
}
export interface NotationPreferences {
  font: "readable" | "mono";
  spacing: "compact" | "relaxed";
  triggers: boolean;
  slices: boolean;
  palette: "original" | "distinct";
}
export interface LibraryProgress {
  version: 1;
  cases: Record<string, CasePreference>;
  favoriteSets: Collection[];
  notation: NotationPreferences;
  filters: {
    query: string;
    collection: "all" | Collection;
    favorites: boolean;
    rating: "all" | Rating;
    sort: "collection" | "name";
  };
}
export const defaultCasePreference = (): CasePreference => ({
  favorite: false,
  rating: "new",
  preferred: "auto",
  variants: {},
});
export const defaultNotation = (): NotationPreferences => ({
  font: "mono",
  spacing: "relaxed",
  triggers: true,
  slices: false,
  palette: "original",
});
export const newLibraryProgress = (): LibraryProgress => ({
  version: 1,
  cases: {},
  favoriteSets: [],
  notation: defaultNotation(),
  filters: {
    query: "",
    collection: "all",
    favorites: false,
    rating: "all",
    sort: "collection",
  },
});
export function validateLibraryProgress(value: unknown): LibraryProgress {
  const d = value as LibraryProgress;
  const object = (v: unknown) =>
    !!v && typeof v === "object" && !Array.isArray(v);
  if (
    !object(d) ||
    d.version !== 1 ||
    !object(d.cases) ||
    !object(d.notation) ||
    !object(d.filters) ||
    !Array.isArray(d.favoriteSets)
  )
    throw new Error("Unsupported catalog record.");
  const n = d.notation,
    f = d.filters;
  if (!["original", "distinct"].includes(n.palette))
    throw new Error("Invalid catalog palette.");
  if (
    !["readable", "mono"].includes(n.font) ||
    !["compact", "relaxed"].includes(n.spacing) ||
    typeof n.triggers !== "boolean" ||
    typeof n.slices !== "boolean" ||
    typeof f.query !== "string" ||
    f.query.length > 120 ||
    !["all", "PLL", "OLL", "F2L"].includes(f.collection) ||
    typeof f.favorites !== "boolean" ||
    !["all", ...RATINGS].includes(f.rating) ||
    !["collection", "name"].includes(f.sort) ||
    d.favoriteSets.some((s) => !["PLL", "OLL", "F2L"].includes(s))
  )
    throw new Error("Invalid catalog preferences.");
  const cases: LibraryProgress["cases"] = {};
  for (const [id, p] of Object.entries(d.cases)) {
    const item = libraryCase(id);
    if (
      !object(p) ||
      typeof p.favorite !== "boolean" ||
      !RATINGS.includes(p.rating) ||
      !["auto", ...item.variants.map((v) => v.id)].includes(p.preferred) ||
      !object(p.variants)
    )
      throw new Error("Invalid case preference.");
    const ratings: CasePreference["variants"] = {};
    for (const [variant, rating] of Object.entries(p.variants)) {
      if (
        !item.variants.some((v) => v.id === variant) ||
        !RATINGS.includes(rating)
      )
        throw new Error("Invalid variant rating.");
      ratings[variant as AlgorithmVariant["id"]] = rating;
    }
    cases[id] = {
      favorite: p.favorite,
      rating: p.rating,
      preferred: p.preferred,
      variants: ratings,
    };
  }
  return {
    version: 1,
    cases,
    favoriteSets: [...new Set(d.favoriteSets)],
    notation: {
      font: n.font,
      spacing: n.spacing,
      triggers: n.triggers,
      slices: n.slices,
      palette: n.palette,
    },
    filters: {
      query: f.query,
      collection: f.collection,
      favorites: f.favorites,
      rating: f.rating,
      sort: f.sort,
    },
  };
}
export function preferredVariant(
  item: LibraryCase,
  progress: LibraryProgress,
): AlgorithmVariant {
  const choice = progress.cases[item.id]?.preferred ?? "auto";
  return (
    item.variants.find(
      (v) =>
        v.id ===
        (choice === "auto"
          ? progress.notation.slices
            ? "reference"
            : "standard"
          : choice),
    ) ?? item.variants[0]!
  );
}
export function searchLibrary(progress: LibraryProgress): LibraryCase[] {
  const f = progress.filters,
    words = f.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = LIBRARY.filter((item) => {
    const p = progress.cases[item.id] ?? defaultCasePreference();
    const haystack =
      `${item.id} ${item.collection} ${item.name} ${item.group} ${item.explanation}`.toLocaleLowerCase();
    return (
      (f.collection === "all" || item.collection === f.collection) &&
      (!f.favorites ||
        p.favorite ||
        progress.favoriteSets.includes(item.collection)) &&
      (f.rating === "all" || p.rating === f.rating) &&
      words.every((word) => haystack.includes(word))
    );
  });
  return f.sort === "name"
    ? result.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      )
    : result;
}
export function algorithmChunks(
  algorithm: string,
): { moves: string; label: string }[] {
  const tokens = algorithm.split(" "),
    result: { moves: string; label: string }[] = [];
  const triggers = [
    ["R U R' U'", "Right trigger"],
    ["L' U' L U", "Left trigger"],
    ["R U' R'", "Right insertion"],
    ["F' U F", "Front insertion"],
  ];
  for (let i = 0; i < tokens.length; ) {
    const trigger = triggers.find(
      ([moves]) =>
        tokens.slice(i, i + moves!.split(" ").length).join(" ") === moves,
    );
    if (trigger) {
      result.push({ moves: trigger[0]!, label: trigger[1]! });
      i += trigger[0]!.split(" ").length;
    } else {
      result.push({ moves: tokens[i]!, label: "" });
      i++;
    }
  }
  return result;
}
