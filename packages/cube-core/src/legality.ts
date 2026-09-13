import { FACES, solved, type CubeState } from "./index.js";

// URFDLB-v1 facelets, viewed from outside each face. Ordered triples preserve
// corner handedness: matching an unordered color set would admit mirror pieces.
const corners = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];
const edges = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];
function parity(permutation: number[]): number {
  let swaps = 0;
  for (let i = 0; i < permutation.length; i++)
    for (let j = i + 1; j < permutation.length; j++)
      if (permutation[i]! > permutation[j]!) swaps++;
  return swaps % 2;
}
function pieces(facelets: string, slots: number[][], label: string) {
  const home = solved(3).facelets;
  const permutation: number[] = [],
    orientations: number[] = [];
  for (const slot of slots) {
    let found = false;
    for (let piece = 0; piece < slots.length; piece++) {
      for (let orientation = 0; orientation < slot.length; orientation++) {
        if (
          slots[piece]!.every(
            (index, k) =>
              home[index] === facelets[slot[(k + orientation) % slot.length]!],
          )
        ) {
          permutation.push(piece);
          orientations.push(orientation);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found)
      throw new Error(
        `Invalid ${label} colors or mirrored corner. Check adjacent faces and their orientation.`,
      );
  }
  if (new Set(permutation).size !== slots.length)
    throw new Error(
      `Duplicate or missing ${label} piece. Recheck the entered stickers.`,
    );
  return {
    permutation,
    sum: orientations.reduce((sum, value) => sum + value, 0),
  };
}
export function validate3x3(value: unknown): CubeState {
  if (!value || typeof value !== "object")
    throw new Error("Enter a 3×3 cube state.");
  const state = value as Partial<CubeState>;
  if (
    state.size !== 3 ||
    state.schemaVersion !== 1 ||
    state.convention !== "URFDLB-v1"
  )
    throw new Error("The solver supports 3×3 cubes in URFDLB-v1 orientation.");
  const facelets = state.facelets;
  if (typeof facelets !== "string" || !/^[URFDLB]{54}$/.test(facelets))
    throw new Error("Fill all 54 stickers using U, R, F, D, L and B colors.");
  for (const [i, face] of FACES.entries()) {
    if ([...facelets].filter((color) => color === face).length !== 9)
      throw new Error(`The ${face} color must appear exactly nine times.`);
    if (facelets[i * 9 + 4] !== face)
      throw new Error(
        "Keep the six centers fixed. Orient the cube using the face guide.",
      );
  }
  const c = pieces(facelets, corners, "corner"),
    e = pieces(facelets, edges, "edge");
  if (c.sum % 3 !== 0)
    throw new Error(
      "Corner twist is impossible with legal turns. Recheck the corner stickers.",
    );
  if (e.sum % 2 !== 0)
    throw new Error(
      "Edge flip is impossible with legal turns. Recheck the edge stickers.",
    );
  if (parity(c.permutation) !== parity(e.permutation))
    throw new Error(
      "Piece parity is impossible with legal turns. Recheck swapped corners or edges.",
    );
  return { ...solved(3), facelets };
}
