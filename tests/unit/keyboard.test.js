import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keyboard, KEY_BINDINGS } from '../../src/js/Keyboard.js';

function fixture() {
  const calls = [];
  const game = {
    state: 1, transition: { activeTransitions: 0 },
    controls: { enabled: true, scramble: null, keyboardMove: (...args) => calls.push(args) },
    scrambler: { convertMove: move => move },
    game: show => calls.push(['game', show]), stats: show => calls.push(['stats', show]),
  };
  const keyboard = Object.assign(Object.create(Keyboard.prototype), { game });
  const press = (key, rest = {}) => {
    let prevented = false;
    keyboard.keydown({ key, preventDefault() { prevented = true; }, ...rest });
    return prevented;
  };
  return { game, calls, press };
}

test('all twelve face bindings dispatch the requested move', () => {
  const { press, calls } = fixture();
  for (const [key, move] of Object.entries(KEY_BINDINGS)) {
    assert.equal(press(key.toUpperCase()), true);
    assert.deepEqual(calls.pop(), ['LAYER', move]);
  }
});

test('shortcuts, editing, held keys and composition never turn the cube', () => {
  const { press, calls } = fixture();
  for (const event of [{ repeat: true }, { isComposing: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { target: { closest: () => ({}) } }]) {
    assert.equal(press('j', event), false);
  }
  assert.deepEqual(calls, []);
});

test('moves are gated by game state, transitions and scrambling', () => {
  for (const change of [g => g.state = 0, g => g.controls.enabled = false, g => g.controls.scramble = {}, g => g.transition.activeTransitions = 1]) {
    const { game, press, calls } = fixture();
    change(game); press('j'); assert.deepEqual(calls, []);
  }
});

test('Enter starts a game and Escape returns from statistics', () => {
  const { game, press, calls } = fixture();
  game.state = 0; press('Enter');
  game.state = 3; press('Escape');
  assert.deepEqual(calls, [['game', true], ['stats', false]]);
});

test('shift reverses whole cube rotations without sticky state', () => {
  const { press, calls } = fixture();
  press('x', { shiftKey: true }); press('x');
  assert.equal(calls[0][1].angle, Math.PI / 2);
  assert.equal(calls[1][1].angle, -Math.PI / 2);
});
