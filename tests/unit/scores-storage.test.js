import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scores } from '../../src/js/Scores.js';
import { Storage } from '../../src/js/Storage.js';

test('score history is bounded while lifetime records and cube sizes stay intact', () => {
  let saves = 0;
  const game = { cube: { sizeGenerated: 3 }, storage: { saveScores: () => saves++ } };
  const scores = new Scores(game);
  for (let time = 1000; time <= 102000; time += 1000) scores.addScore(time);
  assert.equal(scores.data[3].scores.length, 100);
  assert.equal(scores.data[3].scores[0], 3000);
  assert.equal(scores.data[3].solves, 102);
  assert.equal(scores.data[3].best, 1000);
  assert.equal(scores.data[3].worst, 102000);
  assert.equal(scores.data[2].solves, 0);
  assert.equal(saves, 102);
});

test('previously oversized score histories are bounded on the next solve', () => {
  const game = { cube: { sizeGenerated: 3 }, storage: { saveScores() {} } };
  const scores = new Scores(game);
  scores.data[3].scores = Array(500).fill(2000);
  scores.addScore(1000);
  assert.equal(scores.data[3].scores.length, 100);
  assert.equal(scores.data[3].scores.at(-1), 1000);
});

test('invalid saved elapsed times cannot poison the resumed timer', () => {
  const original = globalThis.localStorage;
  try {
    for (const time of [null, 'NaN', '-1', '0', '1250']) {
      const values = { theCube_playing: 'true', theCube_savedState: '{"size":3}', theCube_time: time };
      globalThis.localStorage = { getItem: key => values[key] };
      const game = { cube: { sizeGenerated: 3, loadFromData() {} }, timer: {} };
      Storage.prototype.loadGame.call({ game });
      assert.equal(game.saved, time === '0' || time === '1250');
      if (game.saved) assert.equal(game.timer.deltaTime, Number(time));
    }
  } finally { globalThis.localStorage = original; }
});
