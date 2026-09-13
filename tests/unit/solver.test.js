import test from "node:test";
import assert from "node:assert/strict";
import {
  apply,
  parseMove,
  solved,
  validate3x3,
} from "../../packages/cube-core/dist/index.js";
import {
  ENGINE_VERSION,
  METHOD,
  hashState,
  verifySolution,
} from "../../packages/solver/dist/index.js";
import Cube from "../../packages/solver/vendor/engine.js";

function changed(changes) {
  const state = solved(3),
    letters = [...state.facelets];
  changes(letters);
  return { ...state, facelets: letters.join("") };
}
test("manual 3x3 legality rejects incomplete input, centers, counts and wrong puzzle", () => {
  assert.throws(() => validate3x3(null));
  assert.throws(() => validate3x3(solved(2)), /3×3/);
  assert.throws(
    () => validate3x3({ ...solved(3), facelets: "?".repeat(54) }),
    /54/,
  );
  assert.throws(() => validate3x3(changed((a) => (a[0] = "R"))), /nine/);
  assert.throws(
    () => validate3x3(changed((a) => ([a[4], a[13]] = [a[13], a[4]]))),
    /centers/,
  );
});
test("manual legality detects flipped edge, twisted corner, parity and mirrored corner", () => {
  assert.throws(
    () => validate3x3(changed((a) => ([a[5], a[10]] = [a[10], a[5]]))),
    /Edge flip/,
  );
  assert.throws(
    () =>
      validate3x3(changed((a) => ([a[8], a[9], a[20]] = [a[9], a[20], a[8]]))),
    /Corner twist/,
  );
  assert.throws(
    () => validate3x3(changed((a) => ([a[10], a[19]] = [a[19], a[10]]))),
    /parity/,
  );
  assert.throws(
    () => validate3x3(changed((a) => ([a[9], a[20]] = [a[20], a[9]]))),
    /mirrored/,
  );
  assert.throws(
    () => validate3x3(changed((a) => ([a[19], a[52]] = [a[52], a[19]]))),
    /Duplicate/,
  );
});
test("core and licensed engine agree on every face move and legal compositions", () => {
  for (const face of "URFDLB")
    for (const suffix of ["", "'", "2"]) {
      const token = face + suffix;
      const state = apply(solved(3), parseMove(token, 3));
      assert.deepEqual(validate3x3(state), state);
      assert.equal(
        Cube.fromString(solved(3).facelets).move(token).asString(),
        state.facelets,
      );
    }
  let state = solved(3),
    seed = 1234567;
  for (let i = 0; i < 1000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    state = apply(
      state,
      parseMove("URFDLB"[seed % 6] + ["", "'", "2"][(seed >>> 8) % 3], 3),
    );
    assert.deepEqual(validate3x3(state), state);
  }
});
test("solution verification rejects stale identities, tampering and unsolved results", async () => {
  const state = apply(solved(3), parseMove("R", 3));
  const request = {
    requestId: "a",
    state,
    stateHash: await hashState(state),
    engineVersion: ENGINE_VERSION,
    method: METHOD,
    deadlineMs: Date.now() + 30000,
  };
  const result = {
    requestId: "a",
    stateHash: request.stateHash,
    engineVersion: ENGINE_VERSION,
    method: METHOD,
    moves: ["R'"],
    elapsedMs: 1,
  };
  assert.equal(
    verifySolution(request, result).states.at(-1).facelets,
    solved(3).facelets,
  );
  for (const changed of [
    { requestId: "b" },
    { stateHash: "stale" },
    { engineVersion: "other" },
    { method: "Beginner" },
    { moves: ["R"] },
    { moves: ["x"] },
    { moves: ["R ".repeat(100)] },
    { elapsedMs: NaN },
  ])
    assert.throws(() => verifySolution(request, { ...result, ...changed }));
  assert.notEqual(await hashState(state), await hashState(solved(3)));
});
test("two-phase engine solves independent random cubie states with core verification", async () => {
  const start = performance.now();
  Cube.initSolver();
  const initializationMs = performance.now() - start;
  const times = [];
  for (let i = 0; i < 24; i++) {
    const state = validate3x3({
      ...solved(3),
      facelets: Cube.random().asString(),
    });
    const request = {
      requestId: `fixture-${i}`,
      state,
      stateHash: await hashState(state),
      engineVersion: ENGINE_VERSION,
      method: METHOD,
      deadlineMs: Date.now() + 30000,
    };
    const begin = performance.now(),
      sequence = Cube.fromString(state.facelets).solve();
    const elapsedMs = performance.now() - begin;
    const result = verifySolution(request, {
      requestId: request.requestId,
      stateHash: request.stateHash,
      engineVersion: ENGINE_VERSION,
      method: METHOD,
      moves: sequence.trim().split(/\s+/).filter(Boolean),
      elapsedMs,
    });
    assert.equal(result.states.at(-1).facelets, solved(3).facelets);
    times.push(elapsedMs);
  }
  console.log(
    JSON.stringify({
      solverBenchmark: {
        runtime: process.version,
        platform: process.platform,
        initializationMs: Math.round(initializationMs),
        samples: times.length,
        meanSolveMs: Math.round(
          times.reduce((a, b) => a + b, 0) / times.length,
        ),
        maxSolveMs: Math.round(Math.max(...times)),
      },
    }),
  );
});
