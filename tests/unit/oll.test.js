import test from "node:test";
import assert from "node:assert/strict";
import Cube from "../../packages/solver/vendor/cube.js";
import {
  apply,
  parseMove,
  solved,
} from "../../packages/cube-core/dist/index.js";
import {
  OLL_CASES,
  ollInput,
  ollMoves,
  ollOrientationGuide,
  verifyOLL,
  newOLLProgress,
  newOLLRecord,
  recordOLLStep,
  validateOLLProgress,
} from "../../packages/academy/dist/index.js";
const mask = (value) =>
  value
    .split("")
    .map((letter) => (letter === "U" ? "1" : "0"))
    .join("");
function orbit(cube) {
  const masks = [];
  for (let i = 0; i < 4; i++) {
    masks.push(mask(cube.asString()));
    cube.move("U");
  }
  return masks.sort()[0];
}
test("all 57 OLL cases independently match their numbered reference and finish oriented with PLL still needed", () => {
  assert.equal(OLL_CASES.length, 57);
  assert.equal(new Set(OLL_CASES.map((item) => item.number)).size, 57);
  for (const item of OLL_CASES) {
    verifyOLL(item.id);
    assert.equal(ollOrientationGuide(item.id).length, 8);
    const reference = new Cube().move(item.referenceAlgorithm);
    reference.move(reference.upright());
    assert.equal(
      ollMoves(item.id).reduce((s, t) => apply(s, parseMove(t, 3)), solved(3))
        .facelets,
      reference.asString(),
      item.id,
    );
    const end = Cube.fromString(ollInput(item.id).facelets)
      .move(item.algorithm)
      .asString();
    assert.equal(end.slice(0, 9), "U".repeat(9));
    assert.notEqual(end, solved(3).facelets);
    assert.equal(
      end,
      ollMoves(item.id).reduce(
        (s, t) => apply(s, parseMove(t, 3)),
        ollInput(item.id),
      ).facelets,
    );
    const edges = [1, 3, 5, 7].filter((i) => item.facelets[i] === "U");
    assert.equal(
      item.group,
      edges.length === 4
        ? "cross"
        : edges.length === 0
          ? "dot"
          : edges[0] + edges[1] === 8
            ? "line"
            : "angle",
    );
  }
  assert.equal(OLL_CASES.filter((item) => item.group === "cross").length, 7);
});
test("OLL catalog covers all 216 legal orientation patterns under U adjustments, without duplicates", () => {
  const classes = OLL_CASES.map((item) =>
    orbit(Cube.fromString(item.facelets)),
  );
  assert.equal(new Set(classes).size, 57);
  const covered = new Set([...classes, orbit(new Cube())]);
  assert.equal(covered.size, 58);
  let count = 0;
  for (let c = 0; c < 27; c++)
    for (let e = 0; e < 8; e++) {
      const cube = new Cube();
      const a = c % 3,
        b = Math.floor(c / 3) % 3,
        d = Math.floor(c / 9);
      cube.co = [a, b, d, (6 - a - b - d) % 3, 0, 0, 0, 0];
      const x = e & 1,
        y = (e >> 1) & 1,
        z = (e >> 2) & 1;
      cube.eo = [x, y, z, (x + y + z) % 2, 0, 0, 0, 0, 0, 0, 0, 0];
      assert.ok(covered.has(orbit(cube)), `${c}/${e}`);
      count++;
    }
  assert.equal(count, 216);
});
test("OLL guided practice is separate, bounded and counts one complete manual repetition", () => {
  let record = newOLLRecord();
  const n = ollMoves("OLL27").length;
  for (let step = 1; step <= n; step++)
    record = recordOLLStep("OLL27", record, step, false);
  assert.equal(record.repetitions, 0);
  record = recordOLLStep("OLL27", record, 0, false);
  for (let step = 1; step <= n; step++)
    record = recordOLLStep("OLL27", record, step, true);
  assert.equal(record.repetitions, 1);
  record = recordOLLStep("OLL27", record, n - 1, false);
  record = recordOLLStep("OLL27", record, n, true);
  assert.equal(record.repetitions, 1);
  const valid = { ...newOLLProgress(), cases: { OLL27: record } };
  assert.deepEqual(validateOLLProgress(valid), valid);
  for (const invalid of [
    null,
    { version: 1, selected: "Ua", cases: {} },
    { ...valid, version: 2 },
    { ...valid, cases: { OLL27: { ...record, step: 999 } } },
    { ...valid, cases: { OLL27: { ...record, repetitions: -1 } } },
  ])
    assert.throws(() => validateOLLProgress(invalid));
});
