// The original simulator's panels share one navigation and presentation boundary.
export class CubePanels {
  constructor(game) {
    this.game = game;
    this.nav = document.createElement("nav");
    this.nav.className = "cube-panel-nav";
    this.nav.setAttribute("aria-label", "Cube panels");
    this.nav.innerHTML = `<button data-panel="cube">← Cube</button><button data-panel="settings">Settings</button><button data-panel="stats">Statistics</button>`;
    document.body.append(this.nav);
    this.nav.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || game.transition.activeTransitions) return;
      if (button.dataset.panel === "cube") this.close();
      else this.open(button.dataset.panel);
    });
    for (const [name, element, title, description] of [
      [
        "settings",
        game.dom.prefs,
        "Make it your cube.",
        "Size, motion and color. Your original cube, tuned to you.",
      ],
      [
        "stats",
        game.dom.stats,
        "Every solve counts.",
        "Your touch-cube results. Times and averages for the selected cube size.",
      ],
    ]) {
      const header = document.createElement("header");
      header.className = "cube-panel-heading";
      header.innerHTML = `<div class="panel-cube" aria-hidden="true"><i></i><i></i><i></i></div><p>THE CUBE / ${name === "stats" ? "STATISTICS" : "SETTINGS"}</p><h1 tabindex="-1">${title}</h1><p>${description}</p>`;
      element.prepend(header);
      element.setAttribute(
        "aria-label",
        name === "stats" ? "Cube statistics" : "Cube settings",
      );
      element.setAttribute("role", "region");
      const note = document.createElement("p");
      note.className = "cube-panel-note";
      note.textContent =
        name === "stats"
          ? "A dash means there are not enough solves yet. Physical-cube timer sessions stay in Timer."
          : "Changes save automatically. Changing cube size starts a new cube when you return. Use the color button below to edit individual sticker colors.";
      element.append(note);
    }
    for (const element of [game.dom.prefs, game.dom.stats, game.dom.theme])
      element.inert = true;
    this.view("");
  }

  view(panel) {
    const game = this.game;
    document.body.dataset.cubePanel = panel;
    this.nav.hidden = !["settings", "stats"].includes(panel);
    game.dom.prefs.inert = panel !== "settings";
    game.dom.stats.inert = panel !== "stats";
    game.dom.theme.inert = panel !== "theme";
    game.dom.game.inert = panel === "settings" || panel === "stats";
    for (const button of this.nav.querySelectorAll("button")) {
      if (button.dataset.panel === panel)
        button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
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
    element.querySelector("h1").focus({ preventScroll: true });
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
