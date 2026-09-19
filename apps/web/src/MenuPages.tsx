import { messages } from "./messages";
import { sections } from "./Sections";
import { MenuIcon } from "./MenuIcon";

// Decorative CSS geometry shares the simulator's colors without another renderer.
function CubeMark() {
  return (
    <div className="menu-sculpture" aria-hidden="true">
      <div className="sculpture-shadow" />
      <div className="sculpture-cube">
        {["front", "right", "top"].map((face) => (
          <div className={`sculpture-face sculpture-${face}`} key={face}>
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuPage({ text }: { text: typeof messages.en }) {
  const items = sections(text);
  return (
    <div className="app-menu">
      <section className="menu-identity" aria-label="The Cube">
        <p className="eyebrow">SOLVE · PRACTICE · REPEAT</p>
        <h1 tabIndex={-1}>
          <span>THE</span>CUBE
        </h1>
        <CubeMark />
        <p className="identity-note">A little focus. A new personal best.</p>
      </section>
      <section className="menu-launcher" aria-labelledby="menu-title">
        <div className="menu-heading">
          <h2 id="menu-title">{text.menu}</h2>
          <span>YOUR NEXT MOVE</span>
        </div>
        <div className="menu-grid">
          <a className="menu-play" href="./" aria-label={text.play}>
            <span className="play-icon" aria-hidden="true">
              ▶
            </span>
            <span>
              <strong>{text.play}</strong>
              <small>Back to your touch cube</small>
            </span>
            <span className="launch-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          {items.map((item) => (
            <a
              className="menu-tool"
              href={item.href}
              key={item.href}
              aria-label={item.title}
            >
              <span
                className={`tool-icon icon-${item.icon}`}
                aria-hidden="true"
              >
                <MenuIcon kind={item.icon} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </a>
          ))}
          <div className="menu-secondary">
            <a href="#/about" aria-label={text.about}>
              {text.about}
              <span aria-hidden="true">↗</span>
            </a>
            <a href="#/license" aria-label={text.license}>
              {text.license}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <details className="menu-help">
          <summary>How to play & keyboard controls</summary>
          <p>
            <b>Touch cube:</b> Double-tap to start. Swipe a face to turn it;
            drag outside the cube to rotate your view. The trophy shows your
            best times and averages. The sliders open your original cube
            settings.
          </p>
          <p>
            <b>Keyboard:</b> Enter starts or resumes. Escape goes back. J/F:
            U/U′ · I/K: R/R′ · D/E: L/L′ · H/G: F/F′ · W/O: B/B′ · S/L: D/D′.
            X/Y/Z rotate the cube; Shift reverses a rotation.
          </p>
          <p>
            <b>Practice:</b> Use face buttons to turn and drag to look around.
            Change your keyboard shortcuts in Settings.
          </p>
          <p>
            <b>Physical timer:</b> Hold Space or the touch pad until ready,
            release to start, then press to stop. Escape interrupts.
          </p>
          <a href="./?panel=settings">Cube settings →</a>
        </details>
        <p className="menu-local">
          <span aria-hidden="true">●</span> Saved on this device · Ready offline
          after first visit
        </p>
      </section>
    </div>
  );
}

export function InfoPage({
  kind,
  text,
}: {
  kind: "about" | "license";
  text: typeof messages.en;
}) {
  return (
    <>
      <p className="eyebrow">THE CUBE / {text.menu}</p>
      <h1 tabIndex={-1}>{kind === "about" ? text.about : text.license}</h1>
      <article className="info-card">
        {kind === "about" ? (
          <>
            <h2>Rahul Singh Parmar</h2>
            <p>
              Maintainer of this edition of The Cube, building a place to solve,
              practice and learn.
            </p>
            <p>
              <a href="https://github.com/RahulSinghParmar/the-cube">
                Project source and feedback on GitHub →
              </a>
            </p>
            <h2>Original cube experience</h2>
            <p>
              The original simulator credits Boris Sehovac. That credit remains
              part of this project, alongside the newer practice tools.
            </p>
            <h2>Your practice stays on your device</h2>
            <p>
              No account is required. The touch cube, practice cube and physical
              timer keep their saved data in this browser. Export timer and
              practice backups separately.
            </p>
          </>
        ) : (
          <>
            <h2>Project license information</h2>
            <p>
              The repository package metadata declares ISC. A repository-wide
              LICENSE file has not yet been included; this page does not add or
              change permission to reuse the original work.
            </p>
            <h2>3×3 solver</h2>
            <p>
              The solver uses cubejs 1.3.2 by Petri Lehtinen and Ludovic
              Fernandez, under the MIT License. The bundled engine has ES-module
              wrapper adaptations.{" "}
              <a href="assets/licenses/cubejs-LICENSE.txt">
                Read the full engine license
              </a>
              .
            </p>
            <h2>Acknowledgements</h2>
            <p>The algorithm catalog reuses our verified PLL/OLL fixtures and twelve project-authored F2L setups. CubeSkills references by Feliks Zemdegs and Andy Klise are linked per case. Reference links do not grant reuse rights to their PDFs, videos, diagrams or text; these assets are not bundled. <a href="#/algorithms">Read each case's source notes →</a></p>
            <p>
              The original cube credits Boris Sehovac. The renderer uses
              Three.js, whose license notice is retained in its bundled source.
              The menu and practice interface use React, distributed under the
              MIT License, copyright Meta Platforms, Inc. and affiliates.
            </p>
            <p>
              <a href="https://github.com/RahulSinghParmar/the-cube">
                View the repository and source notices →
              </a>
            </p>
          </>
        )}
      </article>
      <p>
        <a href="#/menu">← {text.menu}</a>
      </p>
    </>
  );
}
