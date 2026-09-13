import test from "node:test";
import assert from "node:assert/strict";
import {
  apply,
  parseMove,
  solved,
  validate3x3,
} from "../../packages/cube-core/dist/index.js";
import {
  LESSONS,
  lessonInput,
  lessonMoves,
  acceptLessonMove,
  validateProgress,
} from "../../packages/academy/dist/index.js";

const home = solved(3).facelets;
const cross = [1, 3, 4, 5, 7, 10, 19, 37, 46];
const layer = [
  ...Array(9).keys(),
  9,
  10,
  11,
  18,
  19,
  20,
  36,
  37,
  38,
  45,
  46,
  47,
];
const two = [
  ...Array(9).keys(),
  ...[9, 18, 36, 45].flatMap((start) =>
    Array.from({ length: 6 }, (_, i) => start + i),
  ),
];
const matches = (state, indices) =>
  indices.every((index) => state.facelets[index] === home[index]);
test("all eight authored exercises have legal setups, validated moves and solved endpoints", () => {
  assert.equal(LESSONS.length, 8);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, 8);
  for (const lesson of LESSONS) {
    let state = validate3x3(lessonInput(lesson));
    lessonMoves(lesson).forEach((token, index) => {
      state = apply(state, parseMove(token, 3));
      assert.deepEqual(acceptLessonMove(lesson, index, token), state);
    });
    assert.equal(state.facelets, home, lesson.id);
  }
});
test("beginner stages preserve the declared earlier layers and complete-review checkpoints", () => {
  assert.ok(matches(lessonInput(LESSONS[3]), cross));
  assert.ok(matches(lessonInput(LESSONS[4]), layer));
  assert.ok(matches(lessonInput(LESSONS[5]), two));
  assert.ok(matches(lessonInput(LESSONS[6]), two));
  assert.equal(lessonInput(LESSONS[6]).facelets.slice(27, 36), "DDDDDDDDD");
  let state = lessonInput(LESSONS[7]);
  for (const [index, lesson] of LESSONS.slice(2, 7).entries()) {
    for (const move of lessonMoves(lesson))
      state = apply(state, parseMove(move, 3));
    if (index === 0) assert.ok(matches(state, cross));
    if (index === 1) assert.ok(matches(state, layer));
    if (index === 2) assert.ok(matches(state, two));
    if (index === 3) assert.equal(state.facelets.slice(27, 36), "DDDDDDDDD");
  }
  assert.equal(state.facelets, home);
});
test("wrong moves and unsupported lesson revisions cannot advance progress", () => {
  assert.throws(() => acceptLessonMove(LESSONS[0], 0, "U"), /has not changed/);
  assert.throws(() => acceptLessonMove(LESSONS[0], 2, "R"));
  for (const value of [
    null,
    { version: 2, lessons: {} },
    { version: 1, lessons: { basics: { revision: 2, step: 1, practiced: 1 } } },
    { version: 1, lessons: { basics: { revision: 1, step: 3, practiced: 0 } } },
    { version: 1, lessons: { other: { revision: 1, step: 0, practiced: 0 } } },
  ])
    assert.throws(() => validateProgress(value));
  assert.deepEqual(
    validateProgress({
      version: 1,
      lessons: { basics: { revision: 1, step: 1, practiced: 0 } },
    }),
    { version: 1, lessons: { basics: { revision: 1, step: 1, practiced: 0 } } },
  );
});
