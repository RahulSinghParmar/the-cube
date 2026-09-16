import "./learning.css";
import "./trainer.css";
import { CasePattern } from "./CasePattern";
import { useEffect, useState } from "react";
import {
  PLL_CASES,
  PLL_GROUPS,
  PLL_EXPLANATIONS,
  PLL_SOURCE,
  pllCase,
  pllInput,
  pllMoves,
  pllPieceGuide,
  verifyPLL,
  newPLLProgress,
  newPLLRecord,
  recordPLLStep,
  validatePLLProgress,
  type PLLGroup,
  type PLLId,
  type PLLRecord,
} from "@the-cube/academy";
import type { Preferences } from "./preferences";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  useLearningStorage,
  SaveRecovery,
  RestoreLearning,
} from "./learning-storage";

export function TrainerPage({ preferences }: { preferences: Preferences }) {
  const store = useLearningStorage(
    `the-cube-pll-v1:${learningScope}`,
    newPLLProgress(),
    validatePLLProgress,
  );
  const [mode, setMode] = useState<"watch" | "practice">("watch");
  const [group, setGroup] = useState<PLLGroup | "all">("all");
  const [generation, setGeneration] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(innerWidth >= 900);
  const id = store.value.selected,
    item = pllCase(id),
    moves = pllMoves(id),
    progress = store.value.cases[id] ?? newPLLRecord();
  const cases = PLL_CASES.filter(
    (item) => group === "all" || item.group === group,
  );
  const learned = PLL_CASES.filter(
    (item) => (store.value.cases[item.id]?.repetitions ?? 0) > 0,
  ).length;
  const guide = pllPieceGuide(id);
  // A broken catalog entry must never offer instructional playback.
  let verificationError = "";
  try {
    verifyPLL(id);
  } catch {
    verificationError =
      "This case could not be verified. Choose another case and report this issue.";
  }
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
  }, []);
  function choose(next: PLLId) {
    store.save({ ...store.value, selected: next });
    setMode("watch");
    if (innerWidth < 900) setLibraryOpen(false);
  }
  function saveRecord(record: PLLRecord) {
    store.save({
      ...store.value,
      cases: { ...store.value.cases, [id]: record },
    });
  }
  function repeat() {
    saveRecord({ ...progress, step: 0, practiced: 0 });
    setMode("practice");
    setGeneration((value) => value + 1);
  }
  return (
    <>
      <p className="eyebrow">ALGORITHM TRAINER · PLL</p>
      <h1 tabIndex={-1}>Find your next pattern.</h1>
      <p>
        Learn how the last-layer pieces move into place. Watch a case, then
        practice each move yourself.
      </p>
      <div className="actions">
        <a className="file-button" href="#/f2l">
          Learn F2L →
        </a>
        <a className="file-button" href="#/oll">
          Learn OLL →
        </a>
        <a className="file-button" href="#/recognize">
          Try recognition drills →
        </a>
      </div>
      <SaveRecovery store={store} />
      <div className="pll-overview">
        <span>
          <b>{learned}</b> / 21 cases practiced
        </span>
        <span>Saved on this device</span>
        <a href="#/learn">New to notation? Start with Learn →</a>
      </div>
      <div className="pll-layout">
        <aside>
          <label className="pll-picker">
            Choose a PLL case
            <select
              aria-label="Choose a PLL case"
              value={id}
              onChange={(event) => choose(event.target.value as PLLId)}
            >
              {PLL_CASES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {PLL_GROUPS[item.group]}
                </option>
              ))}
            </select>
          </label>
          <details
            className="pll-library"
            open={libraryOpen}
            onToggle={(event) => setLibraryOpen(event.currentTarget.open)}
          >
            <summary>Browse all 21 patterns</summary>
            <label>
              Filter patterns
              <select
                aria-label="Filter patterns"
                value={group}
                onChange={(event) =>
                  setGroup(event.target.value as PLLGroup | "all")
                }
              >
                <option value="all">All groups</option>
                {Object.entries(PLL_GROUPS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="pll-cases" role="group" aria-label="PLL cases">
              {cases.map((item) => (
                <button
                  key={item.id}
                  className="secondary pll-case"
                  aria-pressed={id === item.id}
                  aria-label={`${item.id} case${(store.value.cases[item.id]?.repetitions ?? 0) > 0 ? ", practiced" : ""}`}
                  onClick={() => choose(item.id)}
                >
                  <CasePattern id={item.id} small />
                  <strong>{item.id}</strong>
                  <small>
                    {(store.value.cases[item.id]?.repetitions ?? 0) > 0
                      ? "Practiced ✓"
                      : store.value.cases[item.id]?.practiced
                        ? "Learning"
                        : "New"}
                  </small>
                </button>
              ))}
            </div>
          </details>
        </aside>
        <article className="pll-workspace">
          <div className="pll-case-heading">
            <div>
              <p className="eyebrow">{PLL_GROUPS[item.group]}</p>
              <h2 data-testid="pll-case-title">{id} permutation</h2>
              <p>{PLL_EXPLANATIONS[item.group]}</p>
            </div>
            <figure>
              <CasePattern id={id} />
              <figcaption>Top view · B above · F below</figcaption>
            </figure>
          </div>
          <div className="pll-orientation">
            <b>White U on top · green F in front.</b> The white face is already
            complete; compare the colored side rows. The two lower layers are
            solved. Keep this orientation while following the moves.
          </div>
          <details className="pll-piece-guide">
            <summary>Which pieces move in this setup?</summary>
            <ul>
              {guide.map((move) => (
                <li key={move.from}>
                  The <b>{move.from}</b> belongs at the <b>{move.to}</b>.
                </li>
              ))}
            </ul>
            <p>
              Directions name slots on the upper layer, looking down with F in
              front. The pattern and setup show this exact viewing angle.
            </p>
          </details>
          <div className="pll-mode" role="group" aria-label="Training mode">
            <button
              className="secondary"
              aria-pressed={mode === "watch"}
              onClick={() => setMode("watch")}
            >
              Watch algorithm
            </button>
            <button
              className="secondary"
              aria-pressed={mode === "practice"}
              onClick={() => setMode("practice")}
            >
              Practice moves
            </button>
          </div>
          <p className="pll-mode-help">
            {mode === "watch"
              ? "Use Next, Previous or Play to inspect the algorithm. Watching does not add a practice repetition."
              : "Choose the next move, then apply it. Incorrect moves leave the cube unchanged. Complete every move yourself to earn one guided repetition."}
          </p>
          {verificationError ? (
            <p className="error" role="alert">
              {verificationError}
            </p>
          ) : (
            <SequencePlayer
              key={`${id}:${mode}:${generation}`}
              input={pllInput(id)}
              moves={moves}
              preferences={preferences}
              exercise={mode === "practice"}
              initialStep={mode === "practice" ? progress.step : 0}
              exerciseName="PLL practice"
              completionText={
                mode === "watch"
                  ? "This prepared PLL case is solved. Switch to Practice moves to try it yourself."
                  : "This repetition has reached its final step. Only moves applied yourself count toward a guided repetition."
              }
              onStep={(step, manual) => {
                if (mode === "practice")
                  saveRecord(recordPLLStep(id, progress, step, manual));
              }}
              onMistake={() =>
                saveRecord({
                  ...progress,
                  mistakes: Math.min(1000000, progress.mistakes + 1),
                })
              }
            />
          )}
          <div className="pll-progress" role="status">
            <b>
              {progress.repetitions} guided{" "}
              {progress.repetitions === 1 ? "repetition" : "repetitions"}
            </b>
            <span>
              {progress.practiced} / {moves.length} moves practiced in this
              repetition
            </span>
            <span>
              {progress.mistakes} incorrect{" "}
              {progress.mistakes === 1 ? "choice" : "choices"} across
              repetitions
            </span>
            {store.error && (
              <span className="error">
                Changes are not saved. Use the recovery controls above.
              </span>
            )}
          </div>
          <div className="actions">
            <button onClick={repeat}>Start new repetition</button>
            <button
              className="secondary"
              onClick={() =>
                choose(
                  PLL_CASES[
                    (PLL_CASES.findIndex((item) => item.id === id) + 1) %
                      PLL_CASES.length
                  ]!.id,
                )
              }
            >
              Next case →
            </button>
          </div>
        </article>
      </div>
      <details className="lesson-notes">
        <summary>Progress backups & algorithm sources</summary>
        <p>
          Download your PLL progress before moving devices or clearing browser
          data. This record is separate from lessons, cube checkpoints and timer
          history. Guided repetitions measure practice with the displayed moves,
          not memorization or physical solve speed.
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download PLL progress
          </button>
          <RestoreLearning
            restore={async (file) => {
              if (await store.restore(file)) {
                setMode("practice");
                setGeneration((value) => value + 1);
              }
            }}
          />
        </div>
        <p>
          Case revision 1 · Conventional PLL algorithms checked against the{" "}
          <a href={PLL_SOURCE} target="_blank" rel="noreferrer">
            CubeSkills reference by Feliks Zemdegs and Andy Klise
          </a>
          . Our explanations and diagrams are independently authored. These
          face-turn versions keep the cube orientation fixed; slice moves and
          rotations are expanded, so some sequences are longer than
          speed-focused finger-trick versions. Final U adjustments are included.
          Every case is verified with the cube engine before playback.
        </p>
        <p>
          PLL moves the last-layer pieces into their places after orientation is
          complete. OLL training and beginner F2L guided setups are also
          available.
        </p>
      </details>
    </>
  );
}
