// Leave only after the current gesture/animation reaches a stable checkpoint.
export function setupHomeNavigation(game) {
  const link = document.querySelector(".home-menu");
  const status = document.querySelector(".home-status");
  if (!link || !status) return;
  let pending = false;
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (pending) return;
    pending = true;
    const deadline = Date.now() + 15000;
    const leave = () => {
      if (
        game.transition.activeTransitions ||
        game.controls.state !== 0 ||
        game.controls.scramble !== null
      ) {
        status.hidden = false;
        status.textContent = "Finishing your move before opening the menu…";
        if (Date.now() < deadline) {
          setTimeout(leave, 50);
          return;
        }
        status.textContent = "Finish the current gesture, then tap Menu again.";
        pending = false;
        return;
      }
      try {
        if (game.state === 1) {
          if (!game.newGame) game.timer.stop();
          game.storage.saveGame();
        }
        location.assign(link.href);
      } catch {
        pending = false;
        status.hidden = false;
        status.textContent =
          "Your cube could not be saved. Stay here and try Menu again.";
        if (game.state === 1 && !game.newGame) game.timer.start(true);
      }
    };
    leave();
  });
  // Menu links open the same original settings and statistics panels.
  const panel = new URLSearchParams(location.search).get("panel");
  if (panel === "settings" || panel === "stats") {
    const open = () => {
      if (
        game.dom.buttons.prefs.disabled ||
        game.transition.activeTransitions
      ) {
        setTimeout(open, 100);
        return;
      }
      if (panel === "settings") game.prefs(true);
      else game.stats(true);
    };
    open();
  }
}
