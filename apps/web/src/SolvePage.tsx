import "./learning.css";
import { useEffect, useRef, useState } from "react";
import {
  FACES,
  apply,
  parseMove,
  solved,
  validate3x3,
  validateCheckpoint,
  type CubeState,
  type Face,
} from "@the-cube/cube-core";
import type { verifySolution } from "@the-cube/solver";
import type { Preferences } from "./preferences";
import { solveCube } from "./solver-client";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  downloadRecord,
  SaveRecovery,
  RestoreLearning,
  useLearningStorage,
} from "./learning-storage";

const names: Record<Face, string> = {
  U: "White · top",
  R: "Red · right",
  F: "Green · front",
  D: "Yellow · bottom",
  L: "Orange · left",
  B: "Blue · back",
};
const top: Record<Face, Face> = {
  U: "B",
  R: "U",
  F: "U",
  D: "F",
  L: "U",
  B: "U",
};
const left: Record<Face, Face> = {
  U: "L",
  R: "F",
  F: "L",
  D: "L",
  L: "B",
  B: "R",
};
const blank = FACES.map((face) => "????" + face + "????").join("");
interface Draft {
  version: 1;
  facelets: string;
}
function validateDraft(value: unknown): Draft {
  const data = value as Partial<Draft> | null;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.facelets !== "string" ||
    !/^[URFDLB?]{54}$/.test(data.facelets) ||
    !FACES.every((face, index) => data.facelets![index * 9 + 4] === face)
  )
    throw new Error("Invalid solver input draft.");
  return { version: 1, facelets: data.facelets };
}
function orientPractice(state: CubeState): CubeState {
  if (state.size !== 3)
    throw new Error(
      "Choose a 3×3 practice cube first. Other sizes remain saved in Practice.",
    );
  const queue = [state],
    seen = new Set<string>();
  while (queue.length) {
    const next = queue.shift()!,
      centers = FACES.map((_, i) => next.facelets[i * 9 + 4]).join("");
    if (centers === "URFDLB") return validate3x3(next);
    if (seen.has(centers)) continue;
    seen.add(centers);
    for (const token of ["x", "y", "z"])
      queue.push(apply(next, parseMove(token, 3)));
  }
  throw new Error("Could not orient the practice cube.");
}
export function SolvePage({ preferences }: { preferences: Preferences }) {
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
  }, []);
  const store = useLearningStorage<Draft>(
    `the-cube-solver-input-v1:${learningScope}`,
    { version: 1, facelets: blank },
    validateDraft,
  );
  const [face, setFace] = useState<Face>("U"),
    [paint, setPaint] = useState<Face | "?">("U"),
    [paste, setPaste] = useState("");
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<ReturnType<typeof verifySolution> | null>(
      null,
    );
  const active = useRef<AbortController | null>(null),
    resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);
  function clearSolution() {
    active.current?.abort();
    active.current = null;
    setBusy(false);
    setResult(null);
    setError("");
    setStatus("");
  }
  function edit(facelets: string) {
    clearSolution();
    store.save({ version: 1, facelets });
  }
  function replace(facelets: string) {
    if (
      store.value.facelets !== blank &&
      !window.confirm(
        "Replace this solver input? The original simulator and practice cube are not changed.",
      )
    )
      return;
    edit(facelets);
  }
  function usePractice() {
    try {
      const raw = localStorage.getItem(`the-cube-v2:${learningScope}`);
      if (!raw)
        throw new Error(
          "No saved practice cube yet. Open Practice and make a few moves.",
        );
      replace(
        orientPractice(validateCheckpoint(JSON.parse(raw)).state).facelets,
      );
    } catch (error) {
      setError(String(error));
    }
  }
  async function solve() {
    if (active.current) return;
    let state: CubeState;
    try {
      state = validate3x3({ ...solved(3), facelets: store.value.facelets });
    } catch (error) {
      setError(String(error));
      return;
    }
    setError("");
    setResult(null);
    setStatus("Starting the solver…");
    setBusy(true);
    const controller = new AbortController();
    active.current = controller;
    try {
      const verified = await solveCube(state, controller.signal, setStatus);
      if (active.current !== controller || controller.signal.aborted) return;
      setResult(verified);
      setStatus(
        `Verified ${verified.solution.moves.length} moves. Ready to follow at your pace.`,
      );
    } catch (error) {
      if (active.current === controller) {
        setStatus("");
        if (error instanceof DOMException && error.name === "AbortError")
          setStatus("Solve cancelled. Your input is unchanged.");
        else setError(String(error));
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <>
      <p className="eyebrow">MANUAL ENTRY · 3×3</p>
      <h1 tabIndex={-1}>Solve your cube.</h1>
      <p>
        Enter the stickers you see. We check the cube and verify every solution
        before showing the moves.
      </p>
      <SaveRecovery store={store} />
      <details className="solver-editor" open={!result}>
        <summary>
          {result ? "Edit your saved input" : "Enter all six faces"}
        </summary>
        <div className="editor-layout">
          <fieldset disabled={busy} className="face-editor">
            <legend>Sticker colors</legend>
            <p>1. Choose the face you are looking at.</p>
            <div className="face-tabs" role="group" aria-label="Face to enter">
              {FACES.map((item) => (
                <button
                  key={item}
                  className="secondary"
                  aria-pressed={face === item}
                  onClick={() => setFace(item)}
                  aria-label={`Enter ${item} face`}
                >
                  {item}
                  <small>{names[item].split(" · ")[0]}</small>
                </button>
              ))}
            </div>
            <p>2. Pick a color, then tap matching stickers.</p>
            <div
              className="paint-palette"
              role="group"
              aria-label="Sticker color"
            >
              {FACES.map((item) => (
                <button
                  key={item}
                  className={`paint color-${item}`}
                  aria-pressed={paint === item}
                  onClick={() => setPaint(item)}
                  aria-label={`Paint ${names[item].split(" · ")[0]}`}
                >
                  {item}
                </button>
              ))}
              <button
                className="secondary"
                aria-pressed={paint === "?"}
                onClick={() => setPaint("?")}
              >
                Erase
              </button>
            </div>
            <p className="face-orientation">
              <b>
                {face} — {names[face]}
              </b>
              <br />
              Hold {top[face]} above this face and {left[face]} to its left.
            </p>
            <div
              className="sticker-editor"
              role="group"
              aria-label={`${face} face stickers`}
            >
              {[
                ...store.value.facelets.slice(
                  FACES.indexOf(face) * 9,
                  FACES.indexOf(face) * 9 + 9,
                ),
              ].map((color, index) => (
                <button
                  key={index}
                  disabled={index === 4}
                  className={`entry-sticker color-${color}`}
                  aria-label={`${face} row ${Math.floor(index / 3) + 1} column ${(index % 3) + 1}: ${color === "?" ? "unfilled" : names[color as Face].split(" · ")[0]}${index === 4 ? " (fixed center)" : ""}`}
                  onClick={() => {
                    const letters = [...store.value.facelets];
                    letters[FACES.indexOf(face) * 9 + index] = paint;
                    edit(letters.join(""));
                  }}
                >
                  {color}
                  <small>{index === 4 ? "CENTER" : ""}</small>
                </button>
              ))}
            </div>
            <div className="actions">
              <button
                className="secondary"
                onClick={() => setFace(FACES[(FACES.indexOf(face) + 1) % 6]!)}
              >
                Next face →
              </button>
              <span>
                {
                  [...store.value.facelets].filter((color) => color !== "?")
                    .length
                }{" "}
                / 54 entered
              </span>
            </div>
          </fieldset>
          <aside className="entry-guide">
            <h2>Keep the same orientation.</h2>
            <p>
              Start with white on top, green in front and red on the right.
              Match colors to these center labels. If your physical cube uses a
              different color scheme, use each center as the reference instead
              of the color names.
            </p>
            <p>
              Look straight at each face. Fill its rows left to right, top to
              bottom. The center stays fixed. Follow the “above” and “left”
              guide when turning the cube over for D or around for B.
            </p>
            <div className="color-counts" aria-label="Color counts">
              {FACES.map((color) => (
                <span key={color}>
                  <b>{color}</b>{" "}
                  {
                    [...store.value.facelets].filter((value) => value === color)
                      .length
                  }
                  /9
                </span>
              ))}
            </div>
            <details>
              <summary>Use a saved cube or an example</summary>
              <div className="actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={usePractice}
                >
                  Copy practice cube
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    replace(
                      "R U R' U' F2"
                        .split(" ")
                        .reduce((s, m) => apply(s, parseMove(m, 3)), solved(3))
                        .facelets,
                    )
                  }
                >
                  Load example
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => replace(solved(3).facelets)}
                >
                  Solved example
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => replace(blank)}
                >
                  Clear input
                </button>
              </div>
            </details>
            <details>
              <summary>Paste face letters (URFDLB)</summary>
              <label>
                54 face letters
                <textarea
                  maxLength={200}
                  value={paste}
                  disabled={busy}
                  onChange={(event) => setPaste(event.target.value)}
                  rows={3}
                />
              </label>
              <p>
                Six faces in U, R, F, D, L, B order. Nine letters per face,
                viewed from outside.
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  try {
                    const value = validateDraft({
                      version: 1,
                      facelets: paste.replace(/\s/g, "").toUpperCase(),
                    });
                    replace(value.facelets);
                  } catch {
                    setError(
                      "Paste 54 letters from U, R, F, D, L, B (or ?), with fixed centers.",
                    );
                  }
                }}
              >
                Load face letters
              </button>
            </details>
          </aside>
        </div>
        <div className="solver-submit">
          <button disabled={busy} onClick={() => void solve()}>
            Check and solve
          </button>
          {busy && (
            <button
              className="secondary"
              onClick={() => active.current?.abort()}
            >
              Cancel solve
            </button>
          )}
          <span>Runs on this device · Up to 45 seconds</span>
        </div>
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p role="status" className="solver-status">
        {status}
      </p>
      {result && (
        <section className="solver-result">
          <h2 ref={resultHeading} tabIndex={-1}>
            Your verified solution
          </h2>
          <p>
            {result.solution.moves.length === 0
              ? "This cube is already solved."
              : `${result.solution.moves.length} moves · ${result.solution.method} · ${(result.solution.elapsedMs / 1000).toFixed(1)} seconds on this device`}
          </p>
          <p>
            This is a generic solution. <a href="#/learn">Beginner lessons</a>{" "}
            teach the stages separately.
          </p>
          <SequencePlayer
            key={result.solution.requestId}
            input={result.states[0]!}
            moves={result.solution.moves}
            preferences={preferences}
          />
          <button
            className="secondary"
            onClick={() =>
              downloadRecord(
                { input: result.states[0], ...result.solution },
                "the-cube-solution.json",
              )
            }
          >
            Download verified solution
          </button>
        </section>
      )}
      <details className="lesson-notes">
        <summary>Your input & solver details</summary>
        <p>
          Only this input draft is saved here; playback is temporary. Your
          original simulator, practice checkpoint and physical timer history are
          separate. The solver uses cubejs 1.3.2 (MIT), with a separate
          cube-state verifier.
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download solver input
          </button>
          <RestoreLearning
            restore={async (file) => {
              clearSolution();
              await store.restore(file);
            }}
          />
          <a href="assets/licenses/cubejs-LICENSE.txt">Engine license</a>
        </div>
      </details>
    </>
  );
}
