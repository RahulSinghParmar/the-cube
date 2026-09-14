import test from "node:test";
import assert from "node:assert/strict";
import {
  PLL_CASES,
  newRecognitionProgress,
  validateRecognitionProgress,
  recordRecognition,
  recognitionStats,
  pickRecognitionCase,
} from "../../packages/academy/dist/index.js";
const attempt = (id, caseId = "Ua", answer = "Ua", elapsedMs = null) => ({
  id,
  caseId,
  answer,
  elapsedMs,
  at: 1000,
});
test("recognition draws cover every case, avoid immediate repeats and weight recent misses", () => {
  const seen = new Set(
    Array.from({ length: 210 }, (_, i) =>
      pickRecognitionCase([], false, undefined, () => i / 210),
    ),
  );
  assert.equal(seen.size, 21);
  for (const item of PLL_CASES)
    for (const n of [0, 0.5, 0.999])
      assert.notEqual(
        pickRecognitionCase([], false, item.id, () => n),
        item.id,
      );
  const history = Array.from({ length: 20 }, (_, i) =>
    attempt(String(i), "Ua", "T"),
  );
  assert.equal(
    pickRecognitionCase(history, true, undefined, () => 0.4),
    "Ua",
  );
  assert.notEqual(
    pickRecognitionCase(history, false, undefined, () => 0.4),
    "Ua",
  );
  for (const n of [-1, 1, NaN])
    assert.throws(() => pickRecognitionCase([], false, undefined, () => n));
});
test("recognition accuracy includes reveals and timing uses only correct timed responses", () => {
  const result = recognitionStats([
    attempt("a"),
    attempt("b", "Ua", "Ua", 1000),
    attempt("c", "T", "T", 3000),
    attempt("d", "H", "Z", 20),
    attempt("e", "Z", null),
  ]);
  assert.deepEqual(result, {
    total: 5,
    correct: 3,
    revealed: 1,
    accuracy: 60,
    medianMs: 2000,
    timedCorrect: 2,
  });
  assert.equal(recognitionStats([]).accuracy, null);
  assert.equal(recognitionStats([]).medianMs, null);
});
test("recognition history is bounded and duplicate submissions cannot add attempts", () => {
  let value = newRecognitionProgress();
  for (let i = 0; i < 510; i++)
    value = recordRecognition(value, attempt(String(i)));
  assert.equal(value.history.length, 500);
  assert.equal(value.history[0].id, "10");
  assert.deepEqual(recordRecognition(value, attempt("509")), value);
  assert.deepEqual(validateRecognitionProgress(value), value);
});
test("recognition imports reject incompatible data, duplicate IDs and invalid timing", () => {
  const valid = { ...newRecognitionProgress(), history: [attempt("one")] };
  for (const bad of [
    null,
    { version: 1, cases: {} },
    { ...valid, timed: "yes" },
    { ...valid, history: [attempt("one"), attempt("one")] },
    ...[
      { caseId: "unknown" },
      { answer: "unknown" },
      { elapsedMs: -1 },
      { elapsedMs: Infinity },
      { elapsedMs: 86400001 },
      { elapsedMs: 0, answer: null },
      { at: NaN },
      { id: "<bad>" },
    ].map((change) => ({
      ...valid,
      history: [{ ...attempt("one"), ...change }],
    })),
  ])
    assert.throws(() => validateRecognitionProgress(bad));
});
