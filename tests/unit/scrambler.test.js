import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Scrambler } from '../../src/js/Scrambler.js';

// Exercise the same vendored geometry implementation used by the app.
const context = vm.createContext({});
vm.runInContext(readFileSync('assets/js/three.js', 'utf8'), context);
globalThis.THREE = context.THREE;

for (const size of [2, 3, 4, 5]) {
  test(`${size}x${size} face turns are quarter turns and inverse turns cancel`, () => {
    const scrambler = new Scrambler({ cube: { size } });
    for (const face of 'UDLRFB') {
      const move = scrambler.convertMove(face);
      const inverse = scrambler.convertMove(face + "'");
      assert.equal(Math.abs(move.angle), Math.PI / 2);
      assert.equal(move.angle + inverse.angle, 0);
      assert.equal(Math.abs(move.position[move.axis]), size > 3 ? 2 : 1);
    }
  });
}

test('double turns expand into exactly two quarter turns', () => {
  const scrambler = new Scrambler({ cube: { size: 4 } });
  scrambler.scramble('R2');
  assert.equal(scrambler.converted.length, 2);
  assert.equal(Math.abs(scrambler.converted.reduce((sum, move) => sum + move.angle, 0)), Math.PI);
});
