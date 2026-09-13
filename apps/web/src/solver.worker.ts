import { solved, validate3x3 } from "@the-cube/cube-core";
import {
  ENGINE_VERSION,
  METHOD,
  hashState,
  type SolveRequest,
} from "@the-cube/solver";
import Cube from "../../../packages/solver/vendor/engine.js";

self.onmessage = async (event: MessageEvent<SolveRequest>) => {
  const request = event.data;
  try {
    const state = validate3x3(request.state);
    if (
      request.engineVersion !== ENGINE_VERSION ||
      request.method !== METHOD ||
      typeof request.requestId !== "string" ||
      request.stateHash !== (await hashState(state)) ||
      !Number.isFinite(request.deadlineMs) ||
      Date.now() >= request.deadlineMs
    )
      throw new Error("Unsupported or expired solve request.");
    const start = performance.now();
    let sequence = "";
    // The upstream search may return an identity sequence for a solved input.
    // Zero moves still pass through the independent response verifier.
    if (state.facelets !== solved(3).facelets) {
      self.postMessage({
        type: "progress",
        requestId: request.requestId,
        stage: "Preparing the solver…",
      });
      Cube.initSolver();
      if (Date.now() >= request.deadlineMs)
        throw new Error("Solver timed out. Try again.");
      self.postMessage({
        type: "progress",
        requestId: request.requestId,
        stage: "Finding a solution…",
      });
      sequence = Cube.fromString(state.facelets).solve();
    }
    if (Date.now() >= request.deadlineMs)
      throw new Error("Solver timed out. Try again.");
    self.postMessage({
      type: "solution",
      requestId: request.requestId,
      stateHash: request.stateHash,
      engineVersion: ENGINE_VERSION,
      method: METHOD,
      moves: sequence.trim().split(/\s+/).filter(Boolean),
      elapsedMs: performance.now() - start,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: request?.requestId,
      message: String(error),
    });
  }
};
