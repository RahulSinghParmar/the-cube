import {
  apply,
  parseMove,
  solved,
  validate3x3,
  type CubeState,
} from "@the-cube/cube-core";
import { PLL_CATALOG } from "./pll-catalog.js";

export const PLL_SOURCE =
  "https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf";
export const PLL_CASES = PLL_CATALOG;
export type PLLId = (typeof PLL_CASES)[number]["id"];
export const PLL_GROUPS = {
  edges: "Edges only",
  corners: "Corners only",
  adjacent: "Adjacent corners",
  diagonal: "Diagonal corners",
  cycles: "Double cycles",
} as const;
export type PLLGroup = keyof typeof PLL_GROUPS;
export function pllCase(id: string) {
  const item = PLL_CASES.find((item) => item.id === id);
  if (!item) throw new Error("Unknown PLL case.");
  return item;
}
export function pllMoves(id: string): string[] {
  return pllCase(id).algorithm.split(" ");
}
export function pllInput(id: string): CubeState {
  return { ...solved(3), facelets: pllCase(id).facelets };
}
export function verifyPLL(id: string): void {
  const state = validate3x3(pllInput(id)),
    home = solved(3).facelets;
  if (state.facelets.slice(0, 9) !== home.slice(0, 9))
    throw new Error("PLL must keep U oriented.");
  for (let i = 9; i < 54; i++)
    if (
      (Math.floor(i / 9) === 3 || i % 9 >= 3) &&
      state.facelets[i] !== home[i]
    )
      throw new Error("PLL must preserve both lower layers.");
  const end = pllMoves(id).reduce(
    (s, token) => apply(s, parseMove(token, 3)),
    state,
  );
  if (end.facelets !== home)
    throw new Error("PLL algorithm does not solve its fixture.");
}

// Slot names are from above with U on top and F at the front.
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
export function pllPieceGuide(id: string): { from: string; to: string }[] {
  const state = pllInput(id).facelets,
    home = solved(3).facelets;
  const colors = (s: string, indices: number[]) =>
    indices
      .map((i) => s[i])
      .sort()
      .join("");
  return slots.flatMap((slot) => {
    const target = slots.find(
      (target) => colors(home, target.indices) === colors(state, slot.indices),
    );
    if (!target) throw new Error("Unknown PLL piece.");
    return target.name === slot.name
      ? []
      : [{ from: slot.name, to: target.name }];
  });
}
export const PLL_EXPLANATIONS: Record<PLLGroup, string> = {
  edges:
    "The corners are already placed. Compare each upper edge with the center beneath it. Follow the side colors to see which edges exchange places.",
  corners:
    "The upper edges already match their centers. Inspect the two side colors of each corner to find where it belongs.",
  adjacent:
    "Two neighboring upper corners exchange places, together with two edges. The edge positions distinguish the cases in this group.",
  diagonal:
    "Two corners across the top exchange places, together with two edges. Inspect all four side rows; one face alone can look like another case.",
  cycles:
    "Three upper corners and three upper edges cycle together. Trace both sets using the piece guide to distinguish the four G cases.",
};

export interface PLLRecord {
  revision: 1;
  step: number;
  practiced: number;
  repetitions: number;
  mistakes: number;
}
export interface PLLProgress {
  version: 1;
  selected: PLLId;
  cases: Partial<Record<PLLId, PLLRecord>>;
}
export const newPLLRecord = (): PLLRecord => ({
  revision: 1,
  step: 0,
  practiced: 0,
  repetitions: 0,
  mistakes: 0,
});
export const newPLLProgress = (): PLLProgress => ({
  version: 1,
  selected: "Ua",
  cases: {},
});
export function validatePLLProgress(value: unknown): PLLProgress {
  const data = value as Partial<PLLProgress> | null;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.selected !== "string" ||
    !data.cases ||
    typeof data.cases !== "object" ||
    Array.isArray(data.cases)
  )
    throw new Error("Unsupported PLL progress.");
  const selected = pllCase(data.selected).id,
    cases: PLLProgress["cases"] = {};
  for (const [id, record] of Object.entries(data.cases)) {
    const item = pllCase(id),
      limit = pllMoves(id).length;
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
      throw new Error("PLL progress does not match the current case revision.");
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
export function recordPLLStep(
  id: PLLId,
  previous: PLLRecord,
  step: number,
  manual: boolean,
): PLLRecord {
  const limit = pllMoves(id).length;
  if (!Number.isInteger(step) || step < 0 || step > limit)
    throw new Error("Invalid PLL step.");
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
