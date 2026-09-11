import { test } from "node:test";
import assert from "node:assert/strict";
import {
  solved,
  apply,
  parseMove,
  inverse,
  isSolved,
  validateCheckpoint,
  MoveQueue,
  geometry,
} from "../../packages/cube-core/dist/index.js";
for (const size of [2, 3, 4, 5])
  test(`${size}x${size}: every move is a bijection, four quarter turns and inverse restore state`, () => {
    const start = solved(size);
    assert.equal(
      new Set(geometry(size).map((s) => [...s.position, ...s.normal].join(",")))
        .size,
      6 * size * size,
    );
    for (const token of [
      "U",
      "R",
      "F",
      "D",
      "L",
      "B",
      "x",
      "y",
      "z",
      "Rw",
      `${size}Uw`,
    ]) {
      const move = parseMove(token, size);
      let state = start;
      for (let i = 0; i < 4; i++) state = apply(state, move);
      assert.deepEqual(state, start);
      assert.deepEqual(apply(apply(start, move), inverse(move)), start);
      const moved = apply(start, move);
      for (const face of "URFDLB")
        assert.equal(
          [...moved.facelets].filter((c) => c === face).length,
          size * size,
        );
    }
    let state = start;
    const history = [];
    for (let i = 0; i < 150; i++) {
      const token = ["R", "U", "F'", "L2", "B", "D", "Rw", "x"][i % 8];
      history.push(token);
      state = apply(state, parseMove(token, size));
    }
    assert.deepEqual(
      validateCheckpoint({ state, moves: history }).state,
      state,
    );
    for (const token of history.reverse())
      state = apply(state, inverse(parseMove(token, size)));
    assert.deepEqual(state, start);
  });
test("golden face orientation: R takes front right column to up right column; U takes front top to left top", () => {
  const r = apply(solved(3), parseMove("R", 3)).facelets;
  assert.equal(r.slice(0, 9), "UUFUUFUUF");
  assert.equal(r.slice(18, 27), "FFDFFDFFD");
  const u = apply(solved(3), parseMove("U", 3)).facelets;
  assert.equal(u.slice(36, 45), "FFFLLLLLL");
  assert.equal(u.slice(18, 27), "RRRFFFFFF");
  assert.equal(isSolved(apply(solved(3), parseMove("x", 3))), true);
});
test("invalid notation and unreachable state are rejected without guessing", () => {
  for (const token of ["Q", "R3", "4Rw", "2R", "r", "R U"])
    assert.throws(() => parseMove(token, 3));
  assert.throws(() =>
    validateCheckpoint({
      state: { ...solved(3), facelets: "R" + solved(3).facelets.slice(1) },
      moves: [],
    }),
  );
});
test("bounded queue preserves accepted order, stable commits and disposal", async () => {
  const completions = [];
  const commits = [];
  const reports = [];
  const renderer = {
    animate: () => new Promise((resolve) => completions.push(resolve)),
    setState: () => {},
    dispose: () => {},
  };
  const queue = new MoveQueue(
    { state: solved(3), moves: [] },
    renderer,
    (value) => commits.push(value),
    (message) => reports.push(message),
  );
  for (let i = 0; i < 32; i++)
    assert.equal(queue.enqueue(parseMove(i % 2 ? "U" : "R", 3)), true);
  assert.equal(queue.enqueue(parseMove("F", 3)), false);
  assert.equal(commits.length, 0);
  for (let i = 0; i < 32; i++) {
    completions.shift()();
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(commits.length, 32);
  assert.deepEqual(commits.at(-1).moves.slice(0, 4), ["R", "U", "R", "U"]);
  queue.enqueue(parseMove("F", 3));
  queue.dispose();
  completions.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(commits.length, 32);
});

test("renderer and storage failures stop pending moves and report an idle queue", async () => {
  for (const failure of ["render", "save"]) {
    const start = { state: solved(3), moves: [] };
    const restored = [];
    const reports = [];
    const commits = [];
    let finish;
    const renderer = {
      animate: () =>
        new Promise((resolve, reject) => {
          finish = () =>
            failure === "render"
              ? reject(new Error("lost context"))
              : resolve();
        }),
      setState: (state) => restored.push(state),
      dispose: () => {},
    };
    const queue = new MoveQueue(
      start,
      renderer,
      (value) => {
        commits.push(value);
        if (failure === "save") throw new Error("quota");
      },
      (message) => reports.push({ message, length: queue.length }),
    );
    queue.enqueue(parseMove("R", 3));
    queue.enqueue(parseMove("U", 3));
    finish();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queue.length, 0);
    assert.equal(reports.at(-1).length, 0);
    assert.equal(commits.length, failure === "save" ? 1 : 0);
    assert.deepEqual(queue.checkpoint.moves, failure === "save" ? ["R"] : []);
    if (failure === "render") assert.deepEqual(restored, [start.state]);
  }
});
