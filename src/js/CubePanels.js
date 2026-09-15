// The original simulator's panels share one navigation and presentation boundary.
export class CubePanels {
  constructor(game) {
    this.game = game;
    for (const [element, label] of [
      [game.dom.prefs, "Cube settings"],
      [game.dom.stats, "Cube statistics"],
    ]) {
      element.setAttribute("role", "region");
      element.setAttribute("aria-label", label);
      element.tabIndex = -1;
    }
    for (const element of [game.dom.prefs, game.dom.stats, game.dom.theme])
      element.inert = true;
    this.view("");
  }

  view(panel) {
    const game = this.game;
    document.body.dataset.cubePanel = panel;
    game.dom.prefs.inert = panel !== "settings";
    game.dom.stats.inert = panel !== "stats";
    game.dom.theme.inert = panel !== "theme";
    game.dom.game.inert = panel === "settings" || panel === "stats";
    if (panel === "settings" || panel === "stats") {
      game.transition.tweens.float?.stop();
    } else if (game.transition.tweens.float) game.transition.float();
    game.world.setRendering();
  }

  buttons(names) {
    const transition = this.game.transition;
    for (const [name, button] of Object.entries(this.game.dom.buttons)) {
      transition.tweens.buttons[name]?.stop();
      transition.buttonVersions.set(
        button,
        (transition.buttonVersions.get(button) || 0) + 1,
      );
      const visible = names.includes(name);
      button.disabled = !visible;
      button.style.opacity = visible ? "1" : "0";
      button.style.pointerEvents = visible ? "all" : "none";
      button.style.transform = "none";
    }
  }

  open(panel) {
    const game = this.game;
    if (game.transition.activeTransitions || ![0, 3, 4].includes(game.state))
      return;
    if (game.state === 4 && panel !== "settings") game.cube.resize();
    game.state = panel === "settings" ? 4 : 3;
    if (panel === "stats") game.scores.calcStats();
    this.view(panel);
    this.buttons(panel === "settings" ? ["back", "theme"] : ["back"]);
    const url = new URL(location.href);
    url.searchParams.set("panel", panel);
    history.replaceState(null, "", url);
    const element = panel === "settings" ? game.dom.prefs : game.dom.stats;
    element.scrollTop = 0;
    // Place the original controls at their final visible positions without
    // scheduling the homepage entrance or redesigning the panel.
    for (const item of element.querySelectorAll(
      ".range, .range__label, .range__track-line, .range__handle, .range__list div, .stats",
    )) {
      item.style.opacity = "1";
      item.style.transform = "none";
    }
    for (const handle of element.querySelectorAll(".range__handle"))
      handle.style.pointerEvents = "all";
    element.focus({ preventScroll: true });
  }

  close() {
    const game = this.game;
    if (game.transition.activeTransitions) return;
    if (game.state === 4) game.cube.resize();
    game.state = 0;
    // Resume the existing cube in place; no falling-cube entrance on panel exit.
    game.cube.animator.position.y = 0;
    game.cube.animator.rotation.x = 0;
    this.view("");
    game.transition.float();
    this.buttons(["stats", "prefs"]);
    game.transition.title(true);
    const url = new URL(location.href);
    url.searchParams.delete("panel");
    history.replaceState(null, "", url);
    game.dom.texts.title.tabIndex = -1;
    game.dom.texts.title.focus({ preventScroll: true });
  }
}
