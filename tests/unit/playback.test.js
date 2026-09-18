import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, solved, parseMove, inverse, notation, compilePlayback, sequenceTokens, PUZZLES, puzzleForSize, describeMove, validateCheckpoint } from "../../packages/cube-core/dist/index.js";

// Independently indexed face-grid cycles, without the core's geometry/rotation helpers.
function referenceTurn(size, axis, depths) {
  const source = Array.from({ length: 6 * size ** 2 }, (_, i) => String.fromCharCode(256 + i));
  const output = [...source];
  const at = (face, row, col) => "URFDLB".indexOf(face) * size ** 2 + row * size + col;
  const cycle = cells => cells.forEach((cell, i) => { output[cells[(i + 1) % 4]] = source[cell]; });
  for (const d of depths) for (let i = 0; i < size; i++) {
    if (axis === "R") cycle([at("F", i, size - d), at("U", i, size - d), at("B", size - 1 - i, d - 1), at("D", i, size - d)]);
    if (axis === "U") cycle([at("F", d - 1, i), at("L", d - 1, i), at("B", d - 1, i), at("R", d - 1, i)]);
    if (axis === "F") cycle([at("U", size - d, i), at("R", i, d - 1), at("D", d - 1, size - 1 - i), at("L", size - 1 - i, size - d)]);
  }
  function rotate(face, clockwise) {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++)
      output[clockwise ? at(face, c, size - 1 - r) : at(face, size - 1 - c, r)] = source[at(face, r, c)];
  }
  if (depths.includes(1)) rotate(axis, true);
  if (depths.includes(size)) rotate({ R: "L", U: "D", F: "B" }[axis], false);
  return { source: source.join(""), expected: output.join("") };
}

for (const size of [2, 3, 4, 5]) {
  test(`${size}x${size}: independently indexed outer, wide, inner and rotation permutations`, () => {
    for (const face of ["R", "U", "F"]) {
      for (let width = 1; width <= size; width++) {
        const { source, expected } = referenceTurn(size, face, Array.from({ length: width }, (_, i) => i + 1));
        const token = width === 1 ? face : `${width}${face}w`;
        const state = { ...solved(size), facelets: source };
        assert.equal(apply(state, parseMove(token, size)).facelets, expected, token);
        if (width === size) assert.equal(apply(state, parseMove({ R: "x", U: "y", F: "z" }[face], size)).facelets, expected);
      }
      for (let depth = 2; depth < size; depth++) {
        const { source, expected } = referenceTurn(size, face, [depth]);
        const state = { ...solved(size), facelets: source };
        const move = parseMove(`${depth}${face}`, size);
        assert.equal(apply(state, move).facelets, expected);
        assert.deepEqual(parseMove(notation(move), size), move);
        assert.deepEqual(apply(apply(state, move), inverse(move)), state);
        const opposite = { R: "L", U: "D", F: "B" }[face];
        assert.equal(apply(state, parseMove(`${size + 1 - depth}${opposite}'`, size)).facelets, expected);
        if (depth === (size + 1) / 2) assert.equal(apply(state, parseMove({ R: "M'", U: "E'", F: "S" }[face], size)).facelets, expected);
      }
    }
    for (const face of "URFDLB") assert.deepEqual(parseMove(face.toLowerCase(), size), parseMove(`${face}w`, size));
  });
  test(`${size}x${size}: bounded snapshots, random access and old checkpoints stay exact`, () => {
    const tokens = sequenceTokens("R U R' U' x2 Rw y'", size);
    const input = solved(size), original = JSON.stringify(input);
    const playback = compilePlayback(input, tokens);
    for (let step = tokens.length; step > 0; step--) assert.deepEqual(apply(playback.states[step], inverse(playback.moves[step - 1])), playback.states[step - 1]);
    assert.equal(JSON.stringify(input), original);
    assert.deepEqual(validateCheckpoint({ state: playback.states.at(-1), moves: tokens }).state, playback.states.at(-1));
    assert.equal(playback.states.length, tokens.length + 1);
    const started = performance.now();
    assert.equal(compilePlayback(input, Array(500).fill("R")).states.length, 501);
    console.log(JSON.stringify({ playbackBenchmark: { size, moves: 500, compileMs: Math.round(performance.now() - started) } }));
  });
}
test("capabilities and parser reject unqualified sizes, slices and notation", () => {
  assert.deepEqual(PUZZLES.map(p => p.size), [2, 3, 4, 5]);
  for (const size of [2, 3, 4, 5]) assert.equal(Boolean(puzzleForSize(size).solver), size === 3);
  for (const size of [0, 6, 7]) assert.throws(() => puzzleForSize(size));
  for (const size of [2, 4]) for (const slice of ["M", "E", "S"]) assert.throws(() => parseMove(slice, size));
  for (const token of ["Q", "R3", "4Rw", "0R", "1R", "3R", "2rw", "[R,U]", "(R)"]) assert.throws(() => sequenceTokens(token, 3));
  assert.throws(() => compilePlayback(solved(3), Array(501).fill("R")));
  assert.throws(() => sequenceTokens("R ".repeat(6000), 3));
  assert.match(describeMove("M", 5), /only layer 3.*left/);
  assert.match(describeMove("3Rw", 4), /3 layers.*together/);
  assert.match(describeMove("y'", 2), /whole cube.*counterclockwise.*top/);
});
