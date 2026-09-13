import {
  apply,
  parseMove,
  solved,
  validate3x3,
  type CubeState,
} from "@the-cube/cube-core";

export const ENGINE_VERSION = "cubejs-1.3.2-esm1";
export const METHOD = "Kociemba two-phase";
export interface SolveRequest {
  requestId: string;
  state: CubeState;
  stateHash: string;
  engineVersion: typeof ENGINE_VERSION;
  method: typeof METHOD;
  deadlineMs: number;
}
export interface Solution {
  requestId: string;
  stateHash: string;
  engineVersion: typeof ENGINE_VERSION;
  method: typeof METHOD;
  moves: string[];
  elapsedMs: number;
}
export async function hashState(state: CubeState): Promise<string> {
  const bytes = new TextEncoder().encode(
    `${state.size}:${state.convention}:${state.facelets}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
export function verifySolution(
  request: SolveRequest,
  value: unknown,
): { solution: Solution; states: CubeState[] } {
  const input = validate3x3(request.state);
  if (!value || typeof value !== "object")
    throw new Error("Missing solver response.");
  const result = value as Partial<Solution>;
  if (
    result.requestId !== request.requestId ||
    result.stateHash !== request.stateHash ||
    result.engineVersion !== ENGINE_VERSION ||
    result.method !== METHOD
  )
    throw new Error(
      "Stale or unsupported solver response. Enter your cube again.",
    );
  if (
    !Array.isArray(result.moves) ||
    result.moves.length > 100 ||
    !result.moves.every(
      (move) => typeof move === "string" && /^[URFDLB](2|')?$/.test(move),
    )
  )
    throw new Error("The solver returned unsupported moves.");
  if (
    typeof result.elapsedMs !== "number" ||
    !Number.isFinite(result.elapsedMs) ||
    result.elapsedMs < 0
  )
    throw new Error("Invalid solver timing metadata.");
  const states = [input];
  for (const token of result.moves)
    states.push(apply(states.at(-1)!, parseMove(token, 3)));
  if (states.at(-1)!.facelets !== solved(3).facelets)
    throw new Error(
      "Solution verification failed. No playback has been accepted.",
    );
  return {
    solution: { ...result, moves: [...result.moves] } as Solution,
    states,
  };
}
