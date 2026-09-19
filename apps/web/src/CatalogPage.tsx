import { useEffect, useMemo, useState } from "react";
import {
  LIBRARY,
  RATINGS,
  defaultCasePreference,
  libraryCase,
  libraryInput,
  preferredVariant,
  recognitionCues,
  searchLibrary,
  verifyLibraryCase,
  newLibraryProgress,
  type Collection,
  type LibraryProgress,
} from "@the-cube/academy";
import { SequencePlayer } from "./SequencePlayer";
import { FacePattern } from "./CasePattern";
import {
  AlgorithmText,
  CaseLearning,
  NotationControls,
  useCatalogStorage,
} from "./catalog-controls";
import { SaveRecovery, RestoreLearning } from "./learning-storage";
import type { Preferences } from "./preferences";
import "./learning.css";
import "./trainer.css";
import "./catalog.css";

export function CatalogPage({
  preferences,
  requestedCase,
}: {
  preferences: Preferences;
  requestedCase: string | null;
}) {
  const store = useCatalogStorage();
  const [open, setOpen] = useState(!requestedCase || innerWidth >= 900);
  const item =
    LIBRARY.find((item) => item.id === requestedCase) ?? libraryCase("Ua");
  const saved = store.value.cases[item.id] ?? defaultCasePreference();
  const variant = preferredVariant(item, store.value),
    matches = searchLibrary(store.value),
    f = store.value.filters;
  const verificationError = useMemo(() => {
    try {
      verifyLibraryCase(item.id);
      return "";
    } catch {
      return "This case could not be verified. Playback is unavailable.";
    }
  }, [item.id]);
  useEffect(() => {
    document
      .querySelector<HTMLElement>(requestedCase ? "#catalog-case-title" : "h1")
      ?.focus();
  }, [requestedCase]);
  function filters(patch: Partial<LibraryProgress["filters"]>) {
    store.save({ ...store.value, filters: { ...f, ...patch } });
  }
  return (
    <>
      <p className="eyebrow">ALGORITHMS · 3×3</p>
      <h1 tabIndex={-1}>Find a pattern. Learn its moves.</h1>
      <p>
        21 PLL cases · 57 OLL cases · 12 beginner F2L setups. Explore a case,
        save a favorite, then practice at your pace.
      </p>
      <p className="catalog-help">
        F2L covers twelve guided setups, not the full case collection. Ratings
        are your assessment; guided practice keeps its existing progress.
      </p>
      <nav className="actions" aria-label="Guided collections">
        <span>Guided practice:</span>
        <a href="#/f2l">F2L</a>
        <a href="#/oll">OLL</a>
        <a href="#/train">PLL</a>
      </nav>
      <SaveRecovery store={store} />
      {requestedCase && !LIBRARY.some((c) => c.id === requestedCase) && (
        <p role="status">
          That case link is unavailable. Showing Ua; your saved data is
          unchanged.
        </p>
      )}
      <div className="catalog-sets" aria-label="Favorite collections">
        {(["F2L", "OLL", "PLL"] as Collection[]).map((set) => (
          <button
            key={set}
            className="secondary"
            aria-pressed={store.value.favoriteSets.includes(set)}
            onClick={() =>
              store.save({
                ...store.value,
                favoriteSets: store.value.favoriteSets.includes(set)
                  ? store.value.favoriteSets.filter((s) => s !== set)
                  : [...store.value.favoriteSets, set],
              })
            }
          >
            Favorite {set} collection
          </button>
        ))}
      </div>
      <div className="catalog-layout">
        <aside>
          <details
            className="catalog-browser"
            open={open}
            onToggle={(e) => setOpen(e.currentTarget.open)}
          >
            <summary>Browse algorithm catalog</summary>
            <label>
              Search cases
              <input
                type="search"
                value={f.query}
                maxLength={120}
                placeholder="Try Sune, H, edges, insertion…"
                onChange={(e) => filters({ query: e.target.value })}
              />
            </label>
            <div className="catalog-filters">
              <label>
                Collection
                <select
                  value={f.collection}
                  onChange={(e) =>
                    filters({
                      collection: e.target
                        .value as LibraryProgress["filters"]["collection"],
                    })
                  }
                >
                  <option value="all">All collections</option>
                  {["F2L", "OLL", "PLL"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Case rating
                <select
                  value={f.rating}
                  onChange={(e) =>
                    filters({
                      rating: e.target
                        .value as LibraryProgress["filters"]["rating"],
                    })
                  }
                >
                  <option value="all">All ratings</option>
                  {RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r[0]!.toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sort cases
                <select
                  value={f.sort}
                  onChange={(e) =>
                    filters({ sort: e.target.value as "collection" | "name" })
                  }
                >
                  <option value="collection">Collection order</option>
                  <option value="name">Name</option>
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={f.favorites}
                  onChange={(e) => filters({ favorites: e.target.checked })}
                />
                Favorites only
              </label>
            </div>
            <div className="actions">
              <button
                className="quiet"
                onClick={() => filters(newLibraryProgress().filters)}
              >
                Clear filters
              </button>
              <span role="status">
                {matches.length} of {LIBRARY.length} cases
              </span>
            </div>
            <p className="catalog-help">
              Filters stay saved until you clear them. Favorites includes
              starred cases and collections.
            </p>
            <nav className="catalog-results" aria-label="Algorithm cases">
              {matches.map((c) => (
                <a
                  key={c.id}
                  href={`#/algorithms?case=${encodeURIComponent(c.id)}`}
                  aria-current={item.id === c.id ? "page" : undefined}
                >
                  <span>
                    <strong>{c.name}</strong>
                    <small>
                      {c.collection} · {c.group}
                    </small>
                  </span>
                  <span className="catalog-badge">
                    {store.value.cases[c.id]?.favorite ? "★ " : ""}
                    {store.value.cases[c.id]?.rating ?? "new"}
                  </span>
                </a>
              ))}
            </nav>
            {!matches.length && (
              <p>No cases match. Clear filters or try a shorter search.</p>
            )}
          </details>
        </aside>
        <article
          className="catalog-case"
          data-catalog-palette={store.value.notation.palette}
        >
          <p className="eyebrow">
            {item.collection} · {item.group}
          </p>
          <h2 id="catalog-case-title" tabIndex={-1}>
            {item.name}
          </h2>
          {!matches.some((c) => c.id === item.id) && (
            <p className="catalog-help">
              The open case is outside your current filters.
            </p>
          )}
          <div className="catalog-recognition">
            <figure>
              <FacePattern facelets={item.facelets} />
              <figcaption>
                Top view · B above · F below
                <br />
                Letters identify colors
              </figcaption>
            </figure>
            <div>
              <h3>What to look for</h3>
              <p>{item.explanation}</p>
              <p>
                <b>
                  Hold white U on top, green F in front and red R on the right.
                </b>{" "}
                Match the exact pattern before starting. Any final adjustment is
                included in the displayed sequence.
              </p>
            </div>
          </div>
          <details>
            <summary>Piece-by-piece recognition cues</summary>
            <ul>
              {recognitionCues(item).map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </details>
          <h3>Your goal</h3>
          <p>{item.goal}</p>
          <label>
            Preferred algorithm
            <select
              value={saved.preferred}
              onChange={(e) =>
                store.save({
                  ...store.value,
                  cases: {
                    ...store.value.cases,
                    [item.id]: {
                      ...saved,
                      preferred: e.target.value as typeof saved.preferred,
                    },
                  },
                })
              }
            >
              <option value="auto">Follow notation preference</option>
              {item.variants.map((v) => (
                <option value={v.id} key={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <p className="catalog-help">
            {item.variants.length} verified{" "}
            {item.variants.length === 1 ? "version" : "versions"} for this exact
            setup. Current: {variant.name}. Equivalent notation can change the
            move count.
          </p>
          <AlgorithmText
            algorithm={variant.algorithm}
            notation={store.value.notation}
          />
          <CaseLearning id={item.id} variant={variant.id} store={store} />
          {verificationError ? (
            <p role="alert" className="error">
              {verificationError}
            </p>
          ) : (
            <SequencePlayer
              input={libraryInput(item)}
              moves={variant.algorithm.split(" ")}
              preferences={preferences}
              palette={store.value.notation.palette}
              exerciseName="Catalog playback"
              playLabel="Play algorithm"
              completionText="Viewing is complete. Ratings and guided repetitions are unchanged. Open guided practice to apply the moves yourself."
            />
          )}
          <a
            className="file-button"
            href={`#/${item.collection === "PLL" ? "train" : item.collection === "OLL" ? "oll" : "f2l"}?case=${encodeURIComponent(item.id)}`}
          >
            Practice this case →
          </a>
          <p className="catalog-help">
            Guided practice uses the existing face-turn version and keeps your
            saved repetitions.
          </p>
          <details className="catalog-options">
            <summary>Sources, verification & license notes</summary>
            <p>
              These are the existing project case IDs and frozen fixtures. All
              displayed versions reach the same verified final state from this
              exact setup. This is not an arbitrary-state solver.
            </p>
            <p>
              Recognition text and diagrams are project-authored. Conventional
              move sequences were checked against{" "}
              <a href={item.source} target="_blank" rel="noreferrer">
                {item.collection === "F2L"
                  ? "CubeSkills F2L tutorials"
                  : "the CubeSkills reference by Feliks Zemdegs and Andy Klise"}
              </a>
              . The reference is credited, not presented as an open-source
              license. No source PDF, video, illustration or explanatory text is
              bundled.
            </p>
            <p>
              F2L setup names are project lesson IDs, not standard case numbers.
              The full F2L taxonomy will be expanded separately.
            </p>
            <a href="#/license">Project and third-party notices →</a>
          </details>
        </article>
      </div>
      <NotationControls store={store} />
      <details className="catalog-options">
        <summary>Catalog backup & restore</summary>
        <p>
          Includes favorites, explicit ratings, preferred versions, filters and
          notation. Existing trainer, simulator and timer records remain
          separate.
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download catalog backup
          </button>
          <RestoreLearning restore={store.restore} />
        </div>
      </details>
      <p className="section-next">
        <a href="#/guides">New to notation? Open Guides →</a>
        <a href="#/training">Open Training →</a>
      </p>
    </>
  );
}
