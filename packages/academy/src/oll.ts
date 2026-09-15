import {
  apply,
  parseMove,
  solved,
  validate3x3,
  type CubeState,
} from "@the-cube/cube-core";
import { OLL_CATALOG } from "./oll-catalog.js";
export const OLL_CASES = OLL_CATALOG;
export const OLL_SOURCE =
  "https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf";
export type OLLId = (typeof OLL_CASES)[number]["id"];
export const OLL_GROUPS = {
  cross: "Cross · 4 edges up",
  line: "Line · 2 opposite edges up",
  angle: "Angle · 2 adjacent edges up",
  dot: "Dot · no edges up",
} as const;
export type OLLGroup = keyof typeof OLL_GROUPS;
export const OLL_EXPLANATIONS: Record<OLLGroup, string> = {
  cross:
    "All four white edge stickers face up. Compare the corner stickers on top and along the sides. This group contains the seven corner-orientation cases used after making the cross.",
  line: "Two opposite white edge stickers face up, making a line through the center. Use the corner stickers and the white stickers on the side rows to distinguish cases with the same line.",
  angle:
    "Two neighboring white edge stickers face up, making an angle through the center. Compare every corner and the side rows; the angle alone does not identify the case.",
  dot: "No white edge stickers face up. The center is the only edge-cross marker on top. Look at the corner stickers and side rows to distinguish the dot cases.",
};
export function ollCase(id: string) {
  const item = OLL_CASES.find((item) => item.id === id);
  if (!item) throw new Error("Unknown OLL case.");
  return item;
}
export function ollName(id: string) {
  const item = ollCase(id);
  return `OLL ${item.number}${item.number === 27 ? " · Sune" : item.number === 26 ? " · Anti-Sune" : ""}`;
}
export function ollMoves(id: string): string[] {
  return ollCase(id).algorithm.split(" ");
}
export function ollInput(id: string): CubeState {
  return { ...solved(3), facelets: ollCase(id).facelets };
}
export function verifyOLL(id: string): void {
  const input = validate3x3(ollInput(id));
  const end = ollMoves(id).reduce(
    (state, token) => apply(state, parseMove(token, 3)),
    input,
  );
  const home = solved(3).facelets;
  for (let i = 9; i < 54; i++)
    if (
      (Math.floor(i / 9) === 3 || i % 9 >= 3) &&
      (input.facelets[i] !== home[i] || end.facelets[i] !== home[i])
    )
      throw new Error("OLL must preserve both lower layers.");
  if (
    input.facelets.slice(0, 9) === home.slice(0, 9) ||
    end.facelets.slice(0, 9) !== home.slice(0, 9)
  )
    throw new Error("OLL must orient the upper face.");
}
const slots = [
  { name: "front-right corner", indices: [8, 9, 20] },
  { name: "front-left corner", indices: [6, 18, 38] },
  { name: "back-left corner", indices: [0, 36, 47] },
  { name: "back-right corner", indices: [2, 45, 11] },
  { name: "right edge", indices: [5, 10] },
  { name: "front edge", indices: [7, 19] },
  { name: "left edge", indices: [3, 37] },
  { name: "back edge", indices: [1, 46] },
];
export function ollOrientationGuide(id: string): string[] {
  const input = ollInput(id).facelets,
    names = [
      "up (U)",
      "right (R)",
      "front (F)",
      "down (D)",
      "left (L)",
      "back (B)",
    ];
  return slots.map((slot) => {
    const white = slot.indices.find((i) => input[i] === "U");
    if (white === undefined) throw new Error("Missing upper-layer sticker.");
    return `The ${slot.name}'s white sticker faces ${names[Math.floor(white / 9)]}.`;
  });
}

export interface OLLRecord {
  revision: 1;
  step: number;
  practiced: number;
  repetitions: number;
  mistakes: number;
}
export interface OLLProgress {
  version: 1;
  selected: OLLId;
  cases: Partial<Record<OLLId, OLLRecord>>;
}
export const newOLLRecord = (): OLLRecord => ({
  revision: 1,
  step: 0,
  practiced: 0,
  repetitions: 0,
  mistakes: 0,
});
export const newOLLProgress = (): OLLProgress => ({
  version: 1,
  selected: "OLL27",
  cases: {},
});
export function validateOLLProgress(value: unknown): OLLProgress {
  const data = value as Partial<OLLProgress> | null;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.selected !== "string" ||
    !data.cases ||
    typeof data.cases !== "object" ||
    Array.isArray(data.cases)
  )
    throw new Error("Unsupported OLL progress.");
  const selected = ollCase(data.selected).id,
    cases: OLLProgress["cases"] = {};
  for (const [id, record] of Object.entries(data.cases)) {
    const item = ollCase(id),
      limit = ollMoves(id).length;
    if (
      !record ||
      record.revision !== 1 ||
      ![
        record.step,
        record.practiced,
        record.repetitions,
        record.mistakes,
      ].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000) ||
      record.step > limit ||
      record.practiced > limit
    )
      throw new Error("OLL progress does not match the current case revision.");
    cases[item.id] = {
      revision: 1,
      step: record.step,
      practiced: record.practiced,
      repetitions: record.repetitions,
      mistakes: record.mistakes,
    };
  }
  return { version: 1, selected, cases };
}
export function recordOLLStep(
  id: OLLId,
  previous: OLLRecord,
  step: number,
  manual: boolean,
): OLLRecord {
  const limit = ollMoves(id).length;
  if (!Number.isInteger(step) || step < 0 || step > limit)
    throw new Error("Invalid OLL step.");
  const practiced =
    manual && step === previous.practiced + 1 ? step : previous.practiced;
  const finished = practiced === limit && previous.practiced < limit;
  return {
    ...previous,
    step,
    practiced,
    repetitions: Math.min(1000000, previous.repetitions + (finished ? 1 : 0)),
  };
}
