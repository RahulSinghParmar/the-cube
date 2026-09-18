import { apply, parseMove, sizeOf, type CubeState, type Move, type Size } from "./index.js";

// Capabilities are independent: a rendered cube does not imply a solver or course.
export const PUZZLES = ([2, 3, 4, 5] as const).map(size => ({
  id: `${size}x${size}`,
  size,
  label: `${size}×${size}`,
  model: true,
  renderer: "three-cube" as const,
  playback: true,
  notation: { outer: true, wide: true, rotations: true, inner: size > 2, middle: size % 2 === 1 },
  scrambler: "random-moves" as const,
  solver: size === 3 ? "verified-3x3" : null,
  courses: size === 3 ? ["beginner-exercises-v1"] : [],
  methods: size === 3 ? ["beginner", "cfop"] : [],
  devices: [] as string[],
}));

export function puzzleForSize(size: number) {
  return PUZZLES.find(puzzle => puzzle.size === sizeOf(size))!;
}

export const MAX_PLAYBACK_MOVES = 500;
export function sequenceTokens(text: string, size: Size): string[] {
  if (text.length > 10000) throw new Error("Sequence is too long. Use at most 500 moves.");
  const tokens = text.trim().replaceAll("′", "'").split(/\s+/).filter(Boolean);
  if (tokens.length > MAX_PLAYBACK_MOVES) throw new Error("Use at most 500 moves.");
  tokens.forEach(token => parseMove(token, size));
  return tokens;
}

export function compilePlayback(input: CubeState, tokens: readonly string[]) {
  sizeOf(input.size);
  if (tokens.length > MAX_PLAYBACK_MOVES) throw new Error("Use at most 500 moves.");
  if (input.facelets.length !== 6 * input.size ** 2 || /[^URFDLB]/.test(input.facelets))
    throw new Error("Invalid playback facelets.");
  const states = [input];
  const moves: Move[] = [];
  for (const token of tokens) {
    const move = parseMove(token, input.size);
    moves.push(move);
    states.push(apply(states.at(-1)!, move));
  }
  return { states, moves };
}

export function describeMove(token: string, size: Size): string {
  const move = parseMove(token, size);
  const names: Record<string, string> = { U: "top", R: "right", F: "front", D: "bottom", L: "left", B: "back", x: "right", y: "top", z: "front" };
  const amount = move.turns === 2 ? "a half turn (180°)" : move.turns === 3 ? "counterclockwise (90°)" : "clockwise (90°)";
  const face = names[move.face];
  const subject = "xyz".includes(move.face) ? "the whole cube" : move.depth ? `only layer ${move.depth}, counting inward from the ${face} face` : move.layers > 1 ? `the ${move.layers} layers nearest the ${face} face together` : `the ${face} face`;
  return `Turn ${subject} ${amount}, looking directly at the ${face} face. ${"xyz".includes(move.face) ? "The reference faces move with the cube." : "Keep the rest of the cube still."}`;
}
