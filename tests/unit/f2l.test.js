import test from "node:test";
import assert from "node:assert/strict";
import Cube from "../../packages/solver/vendor/cube.js";
import {
  apply,
  parseMove,
  solved,
} from "../../packages/cube-core/dist/index.js";
import {
  F2L_CASES,
  f2lInput,
  f2lMoves,
  f2lPairGuide,
  verifyF2L,
  newF2LProgress,
  newF2LRecord,
  recordF2LStep,
  validateF2LProgress,
} from "../../packages/academy/dist/index.js";

test("all 12 F2L fixtures independently solve the pair, preserving the cross and other slots", () => {
  assert.equal(F2L_CASES.length, 12);
  assert.equal(new Set(F2L_CASES.map((c) => c.facelets)).size, 12);
  for (const item of F2L_CASES) {
    verifyF2L(item.id);
    const independent = Cube.fromString(item.facelets);
    // Explicit cubie indices are independent of the core geometry-based validator.
    for (const i of [5, 6, 7]) {
      assert.equal(independent.cp[i], i);
      assert.equal(independent.co[i], 0);
    }
    for (const i of [4, 5, 6, 7, 9, 10, 11]) {
      assert.equal(independent.ep[i], i);
      assert.equal(independent.eo[i], 0);
    }
    assert.ok(
      independent.cp[4] !== 4 ||
        independent.co[4] !== 0 ||
        independent.ep[8] !== 8 ||
        independent.eo[8] !== 0,
    );
    if (item.group === "trapped") assert.equal(independent.cp[4], 4);
    else assert.ok(independent.cp.indexOf(4) < 4);
    if (item.id.includes("yellow-up"))
      assert.equal(independent.co[independent.cp.indexOf(4)], 0);
    let state = f2lInput(item.id);
    for (const token of f2lMoves(item.id)) {
      independent.move(token);
      state = apply(state, parseMove(token, 3));
      assert.equal(state.facelets, independent.asString(), item.id);
      const guide = f2lPairGuide(state);
      assert.equal(guide.length, 2);
      assert.equal((guide.join(" ").match(/faces /g) ?? []).length, 5);
    }
    for (const i of [4, 5, 6, 7]) {
      assert.equal(independent.cp[i], i);
      assert.equal(independent.co[i], 0);
    }
    for (const i of [4, 5, 6, 7, 8, 9, 10, 11]) {
      assert.equal(independent.ep[i], i);
      assert.equal(independent.eo[i], 0);
    }
    assert.notEqual(state.facelets, solved(3).facelets);
    assert.notEqual(state.facelets.slice(0, 9), "U".repeat(9));
    assert.equal(item.phases[0].start, 0);
    assert.ok(
      item.phases.every(
        (p, i) =>
          Number.isInteger(p.start) &&
          p.start < f2lMoves(item.id).length &&
          (!i || p.start > item.phases[i - 1].start),
      ),
    );
  }
});

test("F2L piece guide locates the solved target with the correct sticker directions", () => {
  assert.deepEqual(f2lPairGuide(solved(3)), [
    "Yellow–green–red corner: right / front / bottom; red faces right, green faces front, yellow faces bottom.",
    "Green–red edge: right / front; red faces right, green faces front.",
  ]);
});

test("F2L watching, skipping, rewinding and reload cannot manufacture practice credit", () => {
  const id = "F2L-right-insert";
  let record = newF2LRecord();
  for (let step = 1; step <= 3; step++)
    record = recordF2LStep(id, record, step, false);
  assert.equal(record.repetitions, 0);
  record = recordF2LStep(id, record, 0, false);
  record = recordF2LStep(id, record, 1, true);
  record = validateF2LProgress({ ...newF2LProgress(), cases: { [id]: record } })
    .cases[id];
  record = recordF2LStep(id, record, 2, false);
  record = recordF2LStep(id, record, 3, true);
  assert.equal(record.practiced, 1);
  assert.equal(record.repetitions, 0);
  record = recordF2LStep(id, record, 1, false);
  record = recordF2LStep(id, record, 2, true);
  record = recordF2LStep(id, record, 3, true);
  assert.equal(record.repetitions, 1);
  record = recordF2LStep(id, record, 2, false);
  record = recordF2LStep(id, record, 3, true);
  assert.equal(record.repetitions, 1);
  record = { ...record, step: 0, practiced: 0 };
  for (let step = 1; step <= 3; step++)
    record = recordF2LStep(id, record, step, true);
  assert.equal(record.repetitions, 2);
  assert.throws(() => recordF2LStep(id, record, 4, true));
});

test("F2L progress rejects other trainers, unknown revisions and malformed counts", () => {
  const valid = {
    ...newF2LProgress(),
    cases: { "F2L-right-insert": newF2LRecord() },
  };
  assert.deepEqual(validateF2LProgress(valid), valid);
  for (const invalid of [
    null,
    [],
    { version: 1, selected: "OLL27", cases: {} },
    { version: 1, selected: "Ua", cases: {} },
    { ...valid, version: 2 },
    { ...valid, cases: [] },
    { ...valid, cases: { bad: newF2LRecord() } },
  ])
    assert.throws(() => validateF2LProgress(invalid));
  for (const [field, value] of [
    ["revision", 2],
    ["step", 4],
    ["practiced", 4],
    ["step", -1],
    ["mistakes", 0.5],
    ["repetitions", 1000001],
    ["repetitions", null],
  ])
    assert.throws(() =>
      validateF2LProgress({
        ...valid,
        cases: { "F2L-right-insert": { ...newF2LRecord(), [field]: value } },
      }),
    );
});
