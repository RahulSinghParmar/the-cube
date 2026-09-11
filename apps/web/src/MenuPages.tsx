import { messages } from "./messages";

export function MenuPage({ text }: { text: typeof messages.en }) {
  const items = [
    {
      title: text.play,
      href: "./",
      mark: "01",
      description:
        "Your full-screen touch cube. Swipe to turn, solve and resume your saved game.",
    },
    {
      title: text.practice,
      href: "#/play",
      mark: "02",
      description:
        "Explore moves with buttons, custom keys, face letters and cube backups.",
    },
    {
      title: text.timer,
      href: "timer.html",
      mark: "03",
      description:
        "Time your physical cube. Sessions, statistics, inspection and solve history.",
    },
    {
      title: text.settings,
      href: "#/settings",
      mark: "04",
      description:
        "Touch-cube settings, practice controls, appearance and language.",
    },
    {
      title: text.license,
      href: "#/license",
      mark: "05",
      description:
        "Project license information and third-party acknowledgements.",
    },
    {
      title: text.about,
      href: "#/about",
      mark: "06",
      description:
        "The people behind this project and its original cube experience.",
    },
  ];
  return (
    <>
      <p className="eyebrow">THE CUBE / {text.menu}</p>
      <h1 tabIndex={-1}>{text.menuTitle}</h1>
      <p className="menu-intro">{text.menuIntro}</p>
      <div className="menu-grid">
        {items.map((item) => (
          <a
            className="menu-card"
            href={item.href}
            key={item.href}
            aria-label={item.title}
          >
            <span className="menu-number" aria-hidden="true">
              {item.mark}
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <span className="menu-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
      <section className="menu-help">
        <h2>More for your touch cube</h2>
        <div className="actions">
          <a href="legacy.html?panel=stats">Cube statistics</a>
          <a href="legacy.html?panel=settings">Cube settings</a>
        </div>
        <details>
          <summary>Keyboard controls</summary>
          <p>
            On the touch cube, Enter starts or resumes and Escape goes back.
            J/F: U/U′ · I/K: R/R′ · D/E: L/L′ · H/G: F/F′ · W/O: B/B′ · S/L:
            D/D′. X/Y/Z rotate the cube; Shift reverses a rotation.
          </p>
          <p>
            Practice has its own customizable keys. Timer uses hold and release
            on Space, or the touch pad.
          </p>
        </details>
      </section>
    </>
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
