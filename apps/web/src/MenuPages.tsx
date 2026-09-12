import { messages } from "./messages";

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
  const items = [
    {
      title: text.practice,
      href: "#/play",
      icon: "cube",
      description: "Explore every move",
    },
    {
      title: text.timer,
      href: "timer.html",
      icon: "timer",
      description: "Time your physical cube",
    },
    {
      title: "Cube statistics",
      href: "./?panel=stats",
      icon: "trophy",
      description: "Best times & averages",
    },
    {
      title: text.settings,
      href: "#/settings",
      icon: "settings",
      description: "Make it feel like you",
    },
  ];
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

function MenuIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    cube: "M12 3 3 8v9l9 5 9-5V8L12 3ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5",
    timer:
      "M9 2h6M12 2v3m6 1 2 2M12 9v5l3 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    trophy:
      "M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v6m-4 0h8",
    settings:
      "M5 3v5m0 4v9M12 3v10m0 4v4M19 3v2m0 4v12M2 8h6v4H2V8Zm7 5h6v4H9v-4Zm7-8h6v4h-6V5Z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind]} />
    </svg>
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
            <h2>Acknowledgements</h2>
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
