export const KEY_BINDINGS = Object.freeze({
  j: 'U', f: "U'", i: 'R', k: "R'", d: 'L', e: "L'",
  h: 'F', g: "F'", w: 'B', o: "B'", s: 'D', l: "D'",
});

export class Keyboard {
  constructor(game) {
    this.game = game;
    this.keydown = this.keydown.bind(this);
    window.addEventListener('keydown', this.keydown);
  }

  keydown(event) {
    if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target?.closest?.('input, textarea, select, button, a, summary, [contenteditable]:not([contenteditable="false"]), [role="slider"]')) return;
    const game = this.game;
    if (game.transition.activeTransitions > 0) return;
    const key = event.key.toLowerCase();
    if (key === 'enter' && game.state === 0) {
      event.preventDefault();
      game.game(true);
      return;
    }
    if (key === 'escape') {
      const action = { 1: 'game', 2: 'complete', 3: 'stats', 4: 'prefs', 5: 'theme' }[game.state];
      if (action) { event.preventDefault(); game[action](false); }
      return;
    }
    if (game.state !== 1 || !game.controls.enabled || game.controls.scramble !== null) return;
    if (KEY_BINDINGS[key]) {
      event.preventDefault();
      game.controls.keyboardMove('LAYER', game.scrambler.convertMove(KEY_BINDINGS[key]));
    } else if (['x', 'y', 'z'].includes(key)) {
      event.preventDefault();
      game.controls.keyboardMove('CUBE', { axis: key, angle: (event.shiftKey ? 1 : -1) * Math.PI / 2 });
    }
  }

  dispose() { window.removeEventListener('keydown', this.keydown); }
}
