import {
  apply,
  geometry,
  parseMove,
  solved,
  validate3x3,
  type CubeState,
} from "@the-cube/cube-core";
import { F2L_CATALOG } from "./f2l-catalog.js";

export const F2L_CASES = F2L_CATALOG;
export const F2L_SOURCE = "https://www.cubeskills.com/tutorials/f2l";
export const F2L_GROUPS = {
  ready: "Ready to insert",
  separate: "Pieces apart",
  joined: "Joined the wrong way",
  trapped: "Pieces in the slot",
} as const;
export type F2LGroup = keyof typeof F2L_GROUPS;
export type F2LId = (typeof F2L_CASES)[number]["id"];
export function f2lCase(id: string) {
  const item = F2L_CASES.find((item) => item.id === id);
  if (!item) throw new Error("Unknown F2L setup.");
  return item;
}
export function f2lMoves(id: string): string[] {
  return f2lCase(id).algorithm.split(" ");
}
export function f2lInput(id: string): CubeState {
  return { ...solved(3), facelets: f2lCase(id).facelets };
}

const stickers = geometry(3);
// Everything at or below the middle layer except the front-right pair.
export const F2L_PROTECTED = stickers.flatMap(({ position: [x, y, z] }, i) =>
  y <= 0 && !(x === 2 && z === 2) ? [i] : [],
);
export const F2L_LOWER_LAYERS = stickers.flatMap(({ position: [, y] }, i) =>
  y <= 0 ? [i] : [],
);
export const F2L_TARGET = stickers.flatMap(({ position: [x, y, z] }, i) =>
  x === 2 && z === 2 && y <= 0 ? [i] : [],
);
export function verifyF2L(id: string): void {
  const input = validate3x3(f2lInput(id));
  const end = f2lMoves(id).reduce(
    (state, token) => apply(state, parseMove(token, 3)),
    input,
  );
  const home = solved(3).facelets;
  if (
    F2L_PROTECTED.some(
      (i) => input.facelets[i] !== home[i] || end.facelets[i] !== home[i],
    )
  )
    throw new Error("F2L must restore the cross and the other three pairs.");
  if (
    F2L_TARGET.every((i) => input.facelets[i] === home[i]) ||
    F2L_LOWER_LAYERS.some((i) => end.facelets[i] !== home[i])
  )
    throw new Error("F2L must solve the target corner and edge.");
  if (end.facelets === home)
    throw new Error(
      "This F2L exercise must leave the last layer for OLL and PLL.",
    );
}

const faceNames: Record<string, string> = {
  U: "top",
  R: "right",
  F: "front",
  D: "bottom",
  L: "left",
  B: "back",
};
const colorNames: Record<string, string> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};
export function f2lPairGuide(state: CubeState): string[] {
  const pieces = new Map<string, number[]>();
  stickers.forEach((s, i) => {
    const key = s.position.join(",");
    pieces.set(key, [...(pieces.get(key) ?? []), i]);
  });
  return ["DFR", "FR"].map((colors) => {
    const indices = [...pieces.values()].find(
      (indices) =>
        indices.length === colors.length &&
        indices
          .map((i) => state.facelets[i])
          .sort()
          .join("") === [...colors].sort().join(""),
    );
    if (!indices) throw new Error("Missing F2L piece.");
    const location = indices
      .map((i) => faceNames[stickers[i]!.face])
      .join(" / ");
    const facing = indices
      .map(
        (i) =>
          `${colorNames[state.facelets[i]!]} faces ${faceNames[stickers[i]!.face]}`,
      )
      .join(", ");
    return `${colors === "DFR" ? "Yellow–green–red corner" : "Green–red edge"}: ${location}; ${facing}.`;
  });
}

export interface F2LRecord {
  revision: 1;
  step: number;
  practiced: number;
  repetitions: number;
  mistakes: number;
}
export interface F2LProgress {
  version: 1;
  selected: F2LId;
  cases: Partial<Record<F2LId, F2LRecord>>;
}
export const newF2LRecord = (): F2LRecord => ({
  revision: 1,
  step: 0,
  practiced: 0,
  repetitions: 0,
  mistakes: 0,
});
export const newF2LProgress = (): F2LProgress => ({
  version: 1,
  selected: "F2L-right-insert",
  cases: {},
});
export function validateF2LProgress(value: unknown): F2LProgress {
  const data = value as Partial<F2LProgress> | null;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.selected !== "string" ||
    !data.cases ||
    typeof data.cases !== "object" ||
    Array.isArray(data.cases)
  )
    throw new Error("Unsupported F2L progress.");
  const selected = f2lCase(data.selected).id,
    cases: F2LProgress["cases"] = {};
  for (const [id, record] of Object.entries(data.cases)) {
    const item = f2lCase(id),
      limit = f2lMoves(id).length;
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
      throw new Error("F2L progress does not match the current case revision.");
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
export function recordF2LStep(
  id: F2LId,
  previous: F2LRecord,
  step: number,
  manual: boolean,
): F2LRecord {
  const limit = f2lMoves(id).length;
  if (!Number.isInteger(step) || step < 0 || step > limit)
    throw new Error("Invalid F2L step.");
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
