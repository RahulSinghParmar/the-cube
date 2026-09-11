export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type Face = (typeof FACES)[number];
export type Size = 2 | 3 | 4 | 5;
export type Vector = readonly [number, number, number];
export interface Move {
  face: Face | "x" | "y" | "z";
  layers: number;
  turns: 1 | 2 | 3;
}
export interface CubeState {
  schemaVersion: 1;
  size: Size;
  convention: "URFDLB-v1";
  facelets: string;
}
export interface Checkpoint {
  state: CubeState;
  moves: string[];
}
export interface Sticker {
  position: Vector;
  normal: Vector;
  face: Face;
  row: number;
  column: number;
}
export function sizeOf(value: unknown): Size {
  if (value !== 2 && value !== 3 && value !== 4 && value !== 5)
    throw new Error("Supported sizes are 2, 3, 4 and 5");
  return value;
}
export function geometry(size: Size): Sticker[] {
  const m = size - 1;
  const result: Sticker[] = [];
  for (const face of FACES)
    for (let row = 0; row < size; row++)
      for (let column = 0; column < size; column++) {
        const a = 2 * column - m,
          b = m - 2 * row;
        const vectors: Record<Face, [Vector, Vector]> = {
          U: [
            [a, m, -b],
            [0, 1, 0],
          ],
          R: [
            [m, b, -a],
            [1, 0, 0],
          ],
          F: [
            [a, b, m],
            [0, 0, 1],
          ],
          D: [
            [a, -m, b],
            [0, -1, 0],
          ],
          L: [
            [-m, b, a],
            [-1, 0, 0],
          ],
          B: [
            [-a, b, -m],
            [0, 0, -1],
          ],
        };
        const [position, normal] = vectors[face];
        result.push({ position, normal, face, row, column });
      }
  return result;
}
export function solved(size: Size): CubeState {
  sizeOf(size);
  return {
    schemaVersion: 1,
    size,
    convention: "URFDLB-v1",
    facelets: FACES.map((face) => face.repeat(size * size)).join(""),
  };
}
export function parseMove(input: string, size: Size): Move {
  const token = input.replaceAll("′", "'");
  const rotation = /^([xyz])(2|')?$/.exec(token);
  if (rotation)
    return {
      face: rotation[1] as Move["face"],
      layers: size,
      turns: rotation[2] === "2" ? 2 : rotation[2] === "'" ? 3 : 1,
    };
  const match = /^(?:(\d))?([URFDLB])(w)?(2|')?$/.exec(token);
  if (!match) throw new Error(`Unsupported move: ${input}`);
  const layers = match[1] ? Number(match[1]) : match[3] ? 2 : 1;
  if ((match[1] && !match[3]) || layers < 1 || layers > size)
    throw new Error(`Invalid layer count: ${input}`);
  return {
    face: match[2] as Face,
    layers,
    turns: match[4] === "2" ? 2 : match[4] === "'" ? 3 : 1,
  };
}
export function notation(move: Move): string {
  const rotation = ["x", "y", "z"].includes(move.face);
  return `${!rotation && move.layers > 2 ? move.layers : ""}${move.face}${!rotation && move.layers > 1 ? "w" : ""}${move.turns === 2 ? "2" : move.turns === 3 ? "'" : ""}`;
}
export function inverse(move: Move): Move {
  return { ...move, turns: move.turns === 1 ? 3 : move.turns === 3 ? 1 : 2 };
}
export function transform(move: Move): {
  axis: 0 | 1 | 2;
  sign: number;
  angle: number;
} {
  const axis = ["R", "L", "x"].includes(move.face)
    ? 0
    : ["U", "D", "y"].includes(move.face)
      ? 1
      : 2;
  const sign = ["L", "D", "B"].includes(move.face) ? -1 : 1;
  return {
    axis,
    sign,
    angle: (-sign * (move.turns === 3 ? -1 : move.turns) * Math.PI) / 2,
  };
}
export function affected(position: Vector, move: Move, size: Size): boolean {
  const { axis, sign } = transform(move);
  return position[axis] * sign >= size - 1 - 2 * (move.layers - 1);
}
function rotate(v: Vector, axis: number, positive: boolean): Vector {
  const [x, y, z] = v;
  const s = positive ? 1 : -1;
  return axis === 0
    ? [x, -s * z, s * y]
    : axis === 1
      ? [s * z, y, -s * x]
      : [-s * y, s * x, z];
}
const key = (position: Vector, normal: Vector) =>
  [...position, ...normal].join(",");
const permutations = new Map<string, readonly number[]>();
export function apply(state: CubeState, move: Move): CubeState {
  if (![1, 2, 3].includes(move.turns) || !Number.isInteger(move.layers))
    throw new Error("Invalid move");
  const parsed = parseMove(notation(move), state.size);
  if (parsed.layers !== move.layers) throw new Error("Invalid move layers");
  const cacheKey = `${state.size}:${notation(move)}`;
  let permutation = permutations.get(cacheKey);
  if (!permutation) {
    const stickers = geometry(state.size);
    const lookup = new Map(
      stickers.map((s, i) => [key(s.position, s.normal), i]),
    );
    const destinations: number[] = [];
    const { axis, sign } = transform(move);
    stickers.forEach((sticker, i) => {
      let position = sticker.position,
        normal = sticker.normal;
      if (affected(position, move, state.size))
        for (let turn = 0; turn < move.turns; turn++) {
          position = rotate(position, axis, sign < 0);
          normal = rotate(normal, axis, sign < 0);
        }
      const destination = lookup.get(key(position, normal));
      if (destination === undefined)
        throw new Error("Invalid cube permutation");
      destinations[i] = destination;
    });
    permutations.set(cacheKey, destinations);
    permutation = destinations;
  }
  const output = [...state.facelets];
  permutation.forEach((destination, i) => {
    output[destination] = state.facelets[i]!;
  });
  return { ...state, facelets: output.join("") };
}
export function isSolved(state: CubeState): boolean {
  const count = state.size * state.size;
  return FACES.every(
    (_, face) =>
      new Set(state.facelets.slice(face * count, (face + 1) * count)).size ===
      1,
  );
}
// Reachability is proven by replay from solved, not guessed from color counts.
// Arbitrary facelet import and 3x3 cubie legality belong to the solver milestone.
export function validateCheckpoint(value: unknown): Checkpoint {
  if (!value || typeof value !== "object")
    throw new Error("Invalid cube checkpoint");
  const data = value as Partial<Checkpoint>;
  const state = data.state;
  if (
    !state ||
    state.schemaVersion !== 1 ||
    state.convention !== "URFDLB-v1" ||
    typeof state.facelets !== "string" ||
    !Array.isArray(data.moves) ||
    data.moves.length > 20000
  )
    throw new Error("Unsupported cube checkpoint");
  const size = sizeOf(state.size);
  let expected = solved(size);
  for (const token of data.moves) {
    if (typeof token !== "string") throw new Error("Invalid move history");
    expected = apply(expected, parseMove(token, size));
  }
  if (expected.facelets !== state.facelets)
    throw new Error("Cube state does not match its verified move history");
  return { state: expected, moves: [...data.moves] };
}
export interface RendererPort {
  animate(before: CubeState, move: Move, after: CubeState): Promise<void>;
  setState(state: CubeState): void;
  dispose(): void;
}
export class MoveQueue {
  private pending: Move[] = [];
  private running = false;
  private disposed = false;
  constructor(
    public checkpoint: Checkpoint,
    private renderer: RendererPort,
    private commit: (value: Checkpoint) => void,
    private report: (message: string) => void,
  ) {}
  get length(): number {
    return this.pending.length + Number(this.running);
  }
  enqueue(move: Move): boolean {
    if (
      this.disposed ||
      this.length >= 32 ||
      this.checkpoint.moves.length + this.length >= 20000
    ) {
      this.report("Move queue is full. Wait for the cube to finish.");
      return false;
    }
    this.pending.push(move);
    void this.drain();
    return true;
  }
  private async drain(): Promise<void> {
    if (this.running || this.disposed) return;
    const move = this.pending.shift();
    if (!move) return;
    this.running = true;
    const before = this.checkpoint.state,
      after = apply(before, move);
    try {
      await this.renderer.animate(before, move, after);
    } catch {
      this.running = false;
      if (!this.disposed) {
        this.renderer.setState(before);
        this.pending = [];
        this.report("Animation interrupted. The last saved cube is preserved.");
      }
      return;
    }
    if (this.disposed) return;
    this.checkpoint = {
      state: after,
      moves: [...this.checkpoint.moves, notation(move)],
    };
    this.running = false;
    try {
      this.commit(this.checkpoint);
    } catch {
      this.pending = [];
      this.report("Cube could not be saved. Export it before leaving.");
    }
    void this.drain();
  }
  dispose(): void {
    this.disposed = true;
    this.pending = [];
    this.renderer.dispose();
  }
}
