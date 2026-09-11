import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  FACES,
  MoveQueue,
  apply,
  inverse,
  isSolved,
  notation,
  parseMove,
  solved,
  sizeOf,
  validateCheckpoint,
  type Checkpoint,
  type Size,
} from "../../../packages/cube-core/src/index";
import { ThreeRenderer } from "./renderer";
import {
  DEFAULT_KEYS,
  defaultPreferences,
  validatePreferences,
  type Preferences,
} from "./preferences";
import { messages } from "./messages";
import "./styles.css";

const scope = location.pathname.replace(/[^/]*$/, "");
const cubeKey = `the-cube-v2:${scope}`,
  preferencesKey = `the-cube-preferences-v2:${scope}`;
function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(preferencesKey);
    return raw ? validatePreferences(JSON.parse(raw)) : defaultPreferences();
  } catch {
    return defaultPreferences();
  }
}
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function App() {
  const [preferences, setPreferences] = useState(readPreferences),
    [draft, setDraft] = useState(preferences);
  const text = messages[preferences.locale];
  const [route, setRoute] = useState(location.hash || "#/play");
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(cubeKey);
      return {
        checkpoint: raw
          ? validateCheckpoint(JSON.parse(raw))
          : ({ state: solved(3), moves: [] } as Checkpoint),
        error: "",
      };
    } catch (error) {
      return {
        checkpoint: { state: solved(3), moves: [] } as Checkpoint,
        error: `Saved cube could not be verified. It has not been overwritten. ${String(error)}`,
      };
    }
  });
  const [checkpoint, setCheckpoint] = useState(initial.checkpoint),
    [error, setError] = useState(initial.error),
    [status, setStatus] = useState(""),
    [queueCount, setQueueCount] = useState(0),
    [generation, setGeneration] = useState(0);
  const [confirmation, setConfirmation] = useState<null | {
    kind: "reset" | "scramble" | "size" | "import";
    size?: Size;
    checkpoint?: Checkpoint;
  }>(null);
  const [canWrite, setCanWrite] = useState(!initial.error),
    [legacySaved, setLegacySaved] = useState(false),
    [update, setUpdate] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLElement>(null),
    renderer = useRef<ThreeRenderer | null>(null),
    queue = useRef<MoveQueue | null>(null),
    current = useRef(checkpoint),
    prefs = useRef(preferences);
  const [elapsed, setElapsed] = useState(0),
    [challenge, setChallenge] = useState(false);
  const clock = useRef<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const activeRoute = useRef(route);
  activeRoute.current = route;
  current.current = checkpoint;
  prefs.current = preferences;
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.locale;
  }, [preferences]);
  useEffect(() => {
    const changed = () => {
      if (queue.current?.length) {
        location.replace(activeRoute.current);
        setStatus("Wait for queued moves to finish before changing pages.");
        return;
      }
      setRoute(location.hash || "#/play");
      if (clock.current !== null) {
        setElapsed(performance.now() - clock.current);
        clock.current = null;
        setChallenge(false);
        setStatus("Virtual attempt interrupted.");
      }
    };
    const leaving = (event: BeforeUnloadEvent) => {
      if (queue.current?.length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leaving);
    window.addEventListener("hashchange", changed);
    try {
      setLegacySaved(localStorage.getItem("theCube_playing") === "true");
    } catch {}
    return () => {
      window.removeEventListener("hashchange", changed);
      window.removeEventListener("beforeunload", leaving);
    };
  }, []);
  useEffect(() => {
    const target = document.querySelector<HTMLElement>("h1");
    target?.focus();
  }, [route]);
  useEffect(() => {
    if (!confirmation) return;
    focusReturn.current = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      focusReturn.current?.focus();
    };
  }, [confirmation]);
  useEffect(() => {
    if (route !== "#/play" || !host.current) return;
    try {
      const view = new ThreeRenderer(host.current, {
        reducedMotion: preferences.reducedMotion,
        labels: preferences.labels,
      });
      renderer.current = view;
      view.setState(current.current.state);
      const moves = new MoveQueue(
        current.current,
        view,
        (value) => {
          current.current = value;
          setCheckpoint(value);
          setQueueCount(moves.length);
          localStorage.setItem(cubeKey, JSON.stringify(value));
          setStatus(messages[prefs.current.locale].saved);
          if (isSolved(value.state) && clock.current !== null) {
            setElapsed(performance.now() - clock.current);
            clock.current = null;
            setChallenge(false);
            setStatus("Solved — well done!");
          }
        },
        (message) => {
          setError(message);
          setQueueCount(moves.length);
        },
      );
      queue.current = moves;
      return () => {
        moves.dispose();
        queue.current = null;
        renderer.current = null;
      };
    } catch (error) {
      setError(
        `3D view unavailable. Face buttons and the text cube still work. ${String(error)}`,
      );
      return;
    }
  }, [route, generation, preferences.reducedMotion, preferences.labels]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (clock.current !== null) setElapsed(performance.now() - clock.current);
    }, 100);
    const interrupt = () => {
      if (document.hidden && clock.current !== null) {
        setElapsed(performance.now() - clock.current);
        clock.current = null;
        setChallenge(false);
        setStatus("Virtual attempt interrupted.");
      }
    };
    document.addEventListener("visibilitychange", interrupt);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", interrupt);
    };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = navigator.serviceWorker.controller !== null;
    void navigator.serviceWorker
      .register("service-worker.js", { scope: "." })
      .then((registration) => {
        if (registration.waiting) setUpdate(true);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              hadController
            )
              setUpdate(true);
          });
        });
      })
      .catch(() => setStatus("Offline files could not be prepared."));
  }, []);
  function finishAttempt(value: Checkpoint) {
    if (isSolved(value.state) && clock.current !== null) {
      setElapsed(performance.now() - clock.current);
      clock.current = null;
      setChallenge(false);
      setStatus("Solved — well done!");
    }
  }
  function send(token: string) {
    if (!canWrite || confirmation) return;
    const move = parseMove(token, current.current.state.size);
    if (challenge && clock.current === null && !/^[xyz]/.test(token))
      clock.current = performance.now() - elapsed;
    if (queue.current) {
      if (queue.current.enqueue(move)) setQueueCount(queue.current.length);
    } else {
      if (current.current.moves.length >= 20000) {
        setError("Move history is full. Export this cube and start a new one.");
        return;
      }
      const value = {
        state: apply(current.current.state, move),
        moves: [...current.current.moves, notation(move)],
      };
      try {
        localStorage.setItem(cubeKey, JSON.stringify(value));
        current.current = value;
        setCheckpoint(value);
        setStatus(messages[prefs.current.locale].saved);
        finishAttempt(value);
      } catch (error) {
        setError(String(error));
      }
    }
  }
  function key(event: React.KeyboardEvent) {
    if (
      event.repeat ||
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      (event.target as HTMLElement).closest(
        "input,select,textarea,button,a,summary,[contenteditable]",
      )
    )
      return;
    const letter = event.key.toLowerCase();
    const found = Object.entries(preferences.keys).find(
      ([, binding]) => binding === letter,
    );
    if (found && !event.shiftKey) {
      event.preventDefault();
      send(found[0]);
    } else if ("xyz".includes(letter) && letter.length === 1) {
      event.preventDefault();
      send(letter + (event.shiftKey ? "'" : ""));
    }
  }
  function replace(next: Checkpoint) {
    try {
      localStorage.setItem(cubeKey, JSON.stringify(next));
      setCanWrite(true);
      setError("");
      queue.current?.dispose();
      queue.current = null;
      current.current = next;
      setCheckpoint(next);
      setGeneration((v) => v + 1);
      setQueueCount(0);
      clock.current = null;
      setElapsed(0);
      setChallenge(false);
    } catch (error) {
      setError(`Cube not replaced: ${String(error)}`);
    }
  }
  function confirm() {
    if (!confirmation) return;
    const change = confirmation;
    setConfirmation(null);
    if (change.kind === "import" && change.checkpoint) {
      replace(change.checkpoint);
      return;
    }
    const size = change.size ?? checkpoint.state.size;
    let next: Checkpoint = { state: solved(size), moves: [] };
    if (change.kind === "scramble") {
      let previous = "";
      for (let i = 0; i < 25; i++) {
        const bytes = crypto.getRandomValues(new Uint32Array(2));
        let face = FACES[bytes[0]! % 6]!;
        if (face === previous) face = FACES[(FACES.indexOf(face) + 1) % 6]!;
        previous = face;
        const token = face + ["", "'", "2"][bytes[1]! % 3];
        next = {
          state: apply(next.state, parseMove(token, size)),
          moves: [...next.moves, token],
        };
      }
    }
    replace(next);
    if (change.kind === "scramble") setChallenge(true);
  }
  function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    try {
      const next = validatePreferences(draft);
      localStorage.setItem(preferencesKey, JSON.stringify(next));
      setPreferences(next);
      setError("");
      setStatus("Preferences saved.");
    } catch (error) {
      setError(String(error));
    }
  }
  async function importCube(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Cube file exceeds 2 MiB");
      const next = validateCheckpoint(JSON.parse(await file.text()));
      setConfirmation({ kind: "import", checkpoint: next });
    } catch (error) {
      setError(`Nothing imported. ${String(error)}`);
    }
  }
  function guardNavigation(event: React.MouseEvent) {
    if ((event.target as HTMLElement).closest("a") && queue.current?.length) {
      event.preventDefault();
      setStatus("Wait for queued moves to finish before changing pages.");
    }
  }
  const busy = queueCount > 0;
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="shell-header" onClickCapture={guardNavigation}>
        <a className="wordmark" href="#/play">
          <span aria-hidden="true">▦</span> THE CUBE
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#/play"
            aria-current={route === "#/play" ? "page" : undefined}
          >
            {text.play}
          </a>
          <a href="timer.html">{text.timer}</a>
          <a
            href="#/settings"
            aria-current={route === "#/settings" ? "page" : undefined}
          >
            {text.settings}
          </a>
        </nav>
        <span className="local-tag">LOCAL / OFFLINE</span>
      </header>
      <main id="main" tabIndex={-1} onClickCapture={guardNavigation}>
        {update && (
          <p role="status" className="notice">
            {text.update}
          </p>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
            {!canWrite && (
              <>
                <button
                  onClick={() => {
                    try {
                      download(
                        localStorage.getItem(cubeKey),
                        "unverified-cube-original.json",
                      );
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Export original saved data
                </button>
                <button onClick={() => setConfirmation({ kind: "reset" })}>
                  Start a new cube
                </button>
              </>
            )}
          </div>
        )}
        {route === "#/play" ? (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{text.eyebrow}</p>
                <h1 tabIndex={-1}>{text.title}</h1>
                <p>{text.intro}</p>
              </div>
              <label className="size-label">
                {text.size}
                <select
                  value={checkpoint.state.size}
                  disabled={busy}
                  onChange={(e) =>
                    setConfirmation({
                      kind: "size",
                      size: sizeOf(Number(e.target.value)),
                    })
                  }
                >
                  {[2, 3, 4, 5].map((size) => (
                    <option key={size} value={size}>
                      {size} × {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {legacySaved && (
              <p className="notice">
                {text.legacyNote}{" "}
                <a href="legacy.html">Resume original saved game →</a>
              </p>
            )}
            <div className="play-layout">
              <section
                className="cube-card"
                ref={panel}
                tabIndex={0}
                aria-label="Interactive cube"
                onKeyDown={key}
              >
                <div className="cube-top">
                  <span
                    className={
                      isSolved(checkpoint.state)
                        ? "state-pill solved"
                        : "state-pill"
                    }
                  >
                    {isSolved(checkpoint.state) ? text.solved : text.mixed}
                  </span>
                  <span>
                    {text.moves}:{" "}
                    <b data-testid="move-count">{checkpoint.moves.length}</b> ·{" "}
                    {text.queue}: <b data-testid="queue-count">{queueCount}</b>
                  </span>
                </div>
                <div className="cube-view" ref={host} />
                <div className="virtual-time" aria-label="Virtual solve time">
                  {Math.floor(elapsed / 60000)}:
                  {String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}.
                  {String(Math.floor(elapsed / 10) % 100).padStart(2, "0")}
                  <small>
                    {challenge
                      ? clock.current === null
                        ? "Timer starts on your first face move"
                        : "Solve in progress"
                      : "Virtual cube practice"}
                  </small>
                </div>
                <div className="cube-actions">
                  <button
                    disabled={busy || !canWrite}
                    onClick={() => setConfirmation({ kind: "scramble" })}
                  >
                    {text.scramble}
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || !canWrite}
                    onClick={() => setConfirmation({ kind: "reset" })}
                  >
                    {text.reset}
                  </button>
                  <button
                    className="quiet"
                    onClick={() => renderer.current?.resetView()}
                  >
                    {text.resetView}
                  </button>
                </div>
                <p className="hint">{text.hint}</p>
                <p role="status" className="save-status">
                  {status || text.ready}
                </p>
              </section>
              <aside className="controls-card">
                <p className="eyebrow">U · R · F · D · L · B</p>
                <h2>{text.controls}</h2>
                <div className="move-grid">
                  {FACES.map((face) => (
                    <div key={face}>
                      <button
                        className="move-button"
                        disabled={!canWrite}
                        onClick={() => send(face)}
                        aria-label={`${face} clockwise`}
                      >
                        {face}
                        <small>{preferences.keys[face]?.toUpperCase()}</small>
                      </button>
                      <button
                        className="move-button"
                        disabled={!canWrite}
                        onClick={() => send(`${face}'`)}
                        aria-label={`${face} counterclockwise`}
                      >
                        {face}′
                        <small>
                          {preferences.keys[`${face}'`]?.toUpperCase()}
                        </small>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="rotation-row">
                  {["x", "y", "z"].map((axis) => (
                    <button
                      key={axis}
                      className="secondary"
                      onClick={() => send(axis)}
                      aria-label={`Rotate ${axis}`}
                    >
                      {axis}
                    </button>
                  ))}
                </div>
                <button
                  className="secondary full"
                  disabled={busy || checkpoint.moves.length === 0 || !canWrite}
                  onClick={() => {
                    const last = checkpoint.moves.at(-1);
                    if (last)
                      send(
                        notation(
                          inverse(parseMove(last, checkpoint.state.size)),
                        ),
                      );
                  }}
                >
                  {text.undo}
                </button>
                <details>
                  <summary>{text.keys}</summary>
                  <p>{text.keyboardHint}</p>
                  <a href="#/settings">{text.settings} →</a>
                </details>
              </aside>
            </div>
            <section className="history-strip">
              <div>
                <p className="eyebrow">{text.sequence}</p>
                <p className="notation" data-testid="move-sequence">
                  {checkpoint.moves.slice(-24).join(" ") || text.empty}
                </p>
              </div>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => download(checkpoint, "the-cube-state.json")}
                >
                  {text.export}
                </button>
                <label className="file-button">
                  {text.import}
                  <input
                    aria-label="Import cube"
                    type="file"
                    accept=".json,application/json"
                    disabled={busy}
                    onChange={(e) => {
                      void importCube(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </section>
            <details className="net-card">
              <summary>{text.net} · URFDLB</summary>
              <p>
                Rows are viewed from outside each face. U = top, R = right, F =
                front, D = bottom, L = left, B = back. Letters also identify
                sticker colors.
              </p>
              <div className="cube-net">
                {FACES.map((face, index) => (
                  <div key={face}>
                    <h3>{face}</h3>
                    <div
                      className="net-face"
                      style={{
                        gridTemplateColumns: `repeat(${checkpoint.state.size},1fr)`,
                      }}
                    >
                      {[
                        ...checkpoint.state.facelets.slice(
                          index * checkpoint.state.size ** 2,
                          (index + 1) * checkpoint.state.size ** 2,
                        ),
                      ].map((color, i) => (
                        <span
                          key={i}
                          className={`sticker color-${color}`}
                          aria-label={`${face} row ${Math.floor(i / checkpoint.state.size) + 1} column ${(i % checkpoint.state.size) + 1}: ${color}`}
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
            <div className="feature-links">
              <a href="timer.html">
                <span>◷</span>
                <div>
                  <h2>{text.openTimer}</h2>
                  <p>{text.timerNote}</p>
                </div>
                <b>→</b>
              </a>
              <a href="legacy.html">
                <span>▦</span>
                <div>
                  <h2>{text.legacy}</h2>
                  <p>{text.legacyNote}</p>
                </div>
                <b>→</b>
              </a>
            </div>
          </>
        ) : route === "#/settings" ? (
          <>
            <p className="eyebrow">{text.settings}</p>
            <h1 tabIndex={-1}>{text.settingsTitle}</h1>
            <p>{text.settingsIntro}</p>
            <form className="settings-card" onSubmit={savePreferences}>
              <div className="settings-grid">
                <label>
                  {text.theme}
                  <select
                    value={draft.theme}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        theme: e.target.value as Preferences["theme"],
                      })
                    }
                  >
                    <option value="light">{text.light}</option>
                    <option value="dark">{text.dark}</option>
                    <option value="contrast">{text.contrast}</option>
                  </select>
                </label>
                <label>
                  {text.language}
                  <select
                    value={draft.locale}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        locale: e.target.value as Preferences["locale"],
                      })
                    }
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={draft.reducedMotion}
                    onChange={(e) =>
                      setDraft({ ...draft, reducedMotion: e.target.checked })
                    }
                  />
                  {text.motion}
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={draft.labels}
                    onChange={(e) =>
                      setDraft({ ...draft, labels: e.target.checked })
                    }
                  />
                  {text.labels}
                </label>
              </div>
              <h2>{text.keys}</h2>
              <p>{text.keyboardHint}</p>
              <div className="key-grid">
                {Object.keys(DEFAULT_KEYS).map((move) => (
                  <label key={move}>
                    {move}
                    <input
                      aria-label={`Key for ${move}`}
                      maxLength={1}
                      value={draft.keys[move] ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          keys: {
                            ...draft.keys,
                            [move]: e.target.value.toLowerCase(),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="actions">
                <button type="submit">{text.save}</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setDraft({ ...draft, keys: { ...DEFAULT_KEYS } })
                  }
                >
                  {text.resetKeys}
                </button>
                <a href="#/play">{text.back}</a>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 tabIndex={-1}>{text.notFound}</h1>
            <a href="#/play">{text.back}</a>
          </>
        )}
        <footer>
          The Cube · <a href="timer.html">{text.data}</a>
        </footer>
      </main>
      <dialog
        ref={dialog}
        aria-label="Confirm cube change"
        onCancel={() => setConfirmation(null)}
      >
        <h2>
          {confirmation?.kind === "import"
            ? "Import verified cube"
            : text.reset}
        </h2>
        <p>{text.newCube}</p>
        {confirmation?.checkpoint && (
          <p>
            {confirmation.checkpoint.state.size}×
            {confirmation.checkpoint.state.size} ·{" "}
            {confirmation.checkpoint.moves.length} verified moves
          </p>
        )}
        <div className="actions">
          <button onClick={confirm}>{text.confirm}</button>
          <button className="secondary" onClick={() => setConfirmation(null)}>
            {text.cancel}
          </button>
        </div>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("app")!).render(<App />);
