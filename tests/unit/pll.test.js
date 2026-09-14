import test from "node:test";
import assert from "node:assert/strict";
import {
  apply,
  parseMove,
  solved,
} from "../../packages/cube-core/dist/index.js";
import Cube from "../../packages/solver/vendor/cube.js";
import {
  PLL_CASES,
  pllInput,
  pllMoves,
  pllPieceGuide,
  verifyPLL,
  newPLLRecord,
  newPLLProgress,
  recordPLLStep,
  validatePLLProgress,
} from "../../packages/academy/dist/index.js";

test("all 21 PLL fixtures preserve the lower layers and match an independently oriented reference algorithm", () => {
  assert.equal(PLL_CASES.length, 21);
  assert.equal(new Set(PLL_CASES.map((c) => c.id)).size, 21);
  for (const item of PLL_CASES) {
    verifyPLL(item.id);
    assert.ok(
      pllMoves(item.id).every((token) => /^[URFDLB](2|')?$/.test(token)),
    );
    const reference = new Cube().move(item.referenceAlgorithm);
    reference.move(reference.upright());
    const fromCore = pllMoves(item.id).reduce(
      (s, token) => apply(s, parseMove(token, 3)),
      solved(3),
    );
    assert.equal(
      reference.asString(),
      fromCore.facelets,
      item.id + " reference",
    );
    assert.equal(
      Cube.fromString(pllInput(item.id).facelets)
        .move(item.algorithm)
        .asString(),
      solved(3).facelets,
      item.id + " fixture",
    );
    const piece = Cube.fromString(item.facelets),
      corners = piece.cp.slice(0, 4).filter((n, i) => n !== i).length,
      edges = piece.ep.slice(0, 4).filter((n, i) => n !== i).length;
    assert.equal(pllPieceGuide(item.id).length, corners + edges);
    if (item.group === "edges") assert.equal(corners, 0);
    if (item.group === "corners") assert.equal(edges, 0);
    if (item.group === "cycles") {
      assert.equal(corners, 3);
      assert.equal(edges, 3);
    }
    if (["adjacent", "diagonal"].includes(item.group)) {
      assert.equal(corners, 2);
      assert.equal(edges, 2);
    }
  }
});

function orbit(cube) {
  const values = [];
  for (let a = 0; a < 4; a++)
    for (let b = 0; b < 4; b++)
      values.push(
        new Cube()
          .move(Array(a).fill("U").join(" "))
          .multiply(cube.toJSON())
          .move(Array(b).fill("U").join(" "))
          .asString(),
      );
  return values.sort()[0];
}
function permutations(a) {
  return a.length === 0
    ? [[]]
    : a.flatMap((n, i) =>
        permutations(a.filter((_, j) => j !== i)).map((rest) => [n, ...rest]),
      );
}
function parity(p) {
  return (
    p.reduce(
      (total, n, i) => total + p.slice(i + 1).filter((m) => m < n).length,
      0,
    ) % 2
  );
}
test("PLL catalog covers all 288 legal upper-layer permutations including the solved/AUF class, without duplicate cases", () => {
  const classes = PLL_CASES.map((item) =>
    orbit(Cube.fromString(item.facelets)),
  );
  assert.equal(new Set(classes).size, 21);
  const covered = new Set([...classes, orbit(new Cube())]);
  assert.equal(covered.size, 22);
  let checked = 0;
  for (const cp of permutations([0, 1, 2, 3]))
    for (const ep of permutations([0, 1, 2, 3]))
      if (parity(cp) === parity(ep)) {
        const cube = new Cube();
        cube.cp = [...cp, 4, 5, 6, 7];
        cube.ep = [...ep, 4, 5, 6, 7, 8, 9, 10, 11];
        assert.ok(covered.has(orbit(cube)), JSON.stringify({ cp, ep }));
        checked++;
      }
  assert.equal(checked, 288);
});

test("guided repetitions require every manual move and never double-count playback or a completed last step", () => {
  let record = newPLLRecord();
  for (let step = 1; step <= pllMoves("Ua").length; step++)
    record = recordPLLStep("Ua", record, step, false);
  assert.equal(record.repetitions, 0);
  assert.equal(record.practiced, 0);
  record = recordPLLStep("Ua", record, 0, false);
  for (let step = 1; step <= pllMoves("Ua").length; step++)
    record = recordPLLStep("Ua", record, step, true);
  assert.equal(record.repetitions, 1);
  record = recordPLLStep("Ua", record, 10, false);
  record = recordPLLStep("Ua", record, 11, true);
  assert.equal(record.repetitions, 1);
  record = { ...record, step: 0, practiced: 0 };
  for (let step = 1; step <= 11; step++)
    record = recordPLLStep("Ua", record, step, true);
  assert.equal(record.repetitions, 2);
  assert.throws(() => recordPLLStep("Ua", record, 12, true));
});

test("PLL progress rejects unknown cases, revisions, invalid counters and out-of-range steps without accepting another backup type", () => {
  const valid = {
    ...newPLLProgress(),
    selected: "H",
    cases: {
      H: {
        ...newPLLRecord(),
        step: 2,
        practiced: 1,
        repetitions: 3,
        mistakes: 2,
      },
    },
  };
  assert.deepEqual(validatePLLProgress(valid), valid);
  for (const bad of [
    null,
    { version: 1, lessons: {} },
    { ...valid, version: 2 },
    { ...valid, selected: "OLL" },
    { ...valid, cases: { Other: newPLLRecord() } },
    ...[
      { step: 999 },
      { revision: 2 },
      { mistakes: -1 },
      { repetitions: 1.5 },
      { practiced: Infinity },
    ].map((change) => ({
      ...valid,
      cases: { H: { ...newPLLRecord(), ...change } },
    })),
  ])
    assert.throws(() => validatePLLProgress(bad));
});
