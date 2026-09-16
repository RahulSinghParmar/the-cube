import "./learning.css";
import "./trainer.css";
import "./oll.css";
import { FacePattern } from "./CasePattern";
import { useEffect, useState } from "react";
import {
  OLL_CASES,
  OLL_GROUPS,
  OLL_EXPLANATIONS,
  OLL_SOURCE,
  ollCase,
  ollInput,
  ollMoves,
  ollOrientationGuide,
  ollName,
  verifyOLL,
  newOLLProgress,
  newOLLRecord,
  recordOLLStep,
  validateOLLProgress,
  type OLLGroup,
  type OLLId,
  type OLLRecord,
} from "@the-cube/academy";
import type { Preferences } from "./preferences";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  useLearningStorage,
  SaveRecovery,
  RestoreLearning,
} from "./learning-storage";

export function OLLPage({ preferences }: { preferences: Preferences }) {
  const store = useLearningStorage(
    `the-cube-oll-v1:${learningScope}`,
    newOLLProgress(),
    validateOLLProgress,
  );
  const [mode, setMode] = useState<"watch" | "practice">("watch");
  const [group, setGroup] = useState<OLLGroup | "all">("all");
  const [generation, setGeneration] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(innerWidth >= 900);
  const id = store.value.selected,
    item = ollCase(id),
    moves = ollMoves(id),
    progress = store.value.cases[id] ?? newOLLRecord();
  const cases = OLL_CASES.filter(
    (item) => group === "all" || item.group === group,
  );
  const learned = OLL_CASES.filter(
    (item) => (store.value.cases[item.id]?.repetitions ?? 0) > 0,
  ).length;
  const guide = ollOrientationGuide(id);
  // A broken catalog entry must never offer instructional playback.
  let verificationError = "";
  try {
    verifyOLL(id);
  } catch {
    verificationError =
      "This case could not be verified. Choose another case and report this issue.";
  }
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
  }, []);
  function choose(next: OLLId) {
    store.save({ ...store.value, selected: next });
    setMode("watch");
    if (innerWidth < 900) setLibraryOpen(false);
  }
  function saveRecord(record: OLLRecord) {
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
      <p className="eyebrow">ALGORITHM TRAINER · OLL</p>
      <h1 tabIndex={-1}>Orient the last layer.</h1>
      <p>
        Turn every white last-layer sticker upward. Start with Sune (OLL 27),
        then explore the full library. OLL orients the top; PLL places its
        pieces afterward.
      </p>
      <div className="actions">
        <a className="file-button" href="#/f2l">
          Learn F2L →
        </a>
        <a className="file-button" href="#/train">
          PLL library →
        </a>
        <a className="file-button" href="#/recognize">
          PLL recognition drills →
        </a>
      </div>
      <SaveRecovery store={store} />
      <div className="pll-overview">
        <span>
          <b>{learned}</b> / 57 cases practiced
        </span>
        <span>Saved on this device</span>
        <a href="#/learn">New to notation? Start with Learn →</a>
      </div>
      <div className="pll-layout">
        <aside>
          <label className="pll-picker">
            Choose an OLL case
            <select
              aria-label="Choose an OLL case"
              value={id}
              onChange={(event) => choose(event.target.value as OLLId)}
            >
              {OLL_CASES.map((item) => (
                <option key={item.id} value={item.id}>
                  {ollName(item.id)} · {OLL_GROUPS[item.group]}
                </option>
              ))}
            </select>
          </label>
          <details
            className="pll-library oll-library"
            open={libraryOpen}
            onToggle={(event) => setLibraryOpen(event.currentTarget.open)}
          >
            <summary>Browse all 57 patterns</summary>
            <label>
              Filter patterns
              <select
                aria-label="Filter patterns"
                value={group}
                onChange={(event) =>
                  setGroup(event.target.value as OLLGroup | "all")
                }
              >
                <option value="all">All groups</option>
                {Object.entries(OLL_GROUPS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="pll-cases" role="group" aria-label="OLL cases">
              {cases.map((item) => (
                <button
                  key={item.id}
                  className="secondary pll-case"
                  aria-pressed={id === item.id}
                  aria-label={`${item.id} case${(store.value.cases[item.id]?.repetitions ?? 0) > 0 ? ", practiced" : ""}`}
                  onClick={() => choose(item.id)}
                >
                  <FacePattern
                    facelets={ollInput(item.id).facelets}
                    small
                    orientationOnly
                  />
                  <strong>{item.number}</strong>
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
              <p className="eyebrow">{OLL_GROUPS[item.group]}</p>
              <h2 data-testid="oll-case-title">{ollName(id)}</h2>
              <p>{OLL_EXPLANATIONS[item.group]}</p>
            </div>
            <figure>
              <FacePattern facelets={ollInput(id).facelets} orientationOnly />
              <figcaption>Top view · B above · F below</figcaption>
            </figure>
          </div>
          <div className="pll-orientation">
            <b>White U center on top · green F center in front.</b> White
            stickers are highlighted; gray means a different color. The two
            lower layers start solved. Match all white stickers around the top
            and side rows, then keep this viewing angle during playback.
          </div>
          <details className="pll-piece-guide">
            <summary>Where are the white stickers?</summary>
            <ul>
              {guide.map((description) => (
                <li key={description}>{description}</li>
              ))}
            </ul>
            <p>
              Directions name the sticker faces in this exact setup. The center
              stays on U; corner and edge stickers must turn upward. Side colors
              are not used to recognize OLL.
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
              input={ollInput(id)}
              moves={moves}
              preferences={preferences}
              exercise={mode === "practice"}
              initialStep={mode === "practice" ? progress.step : 0}
              exerciseName="OLL practice"
              completionText={
                mode === "watch"
                  ? "The top face is oriented and both lower layers are preserved. The side pieces still need PLL. Switch to Practice moves to try this case yourself."
                  : "The top face is oriented; PLL is still needed. Only moves applied yourself count toward a guided repetition."
              }
              onStep={(step, manual) => {
                if (mode === "practice")
                  saveRecord(recordOLLStep(id, progress, step, manual));
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
                  OLL_CASES[
                    (OLL_CASES.findIndex((item) => item.id === id) + 1) %
                      OLL_CASES.length
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
          Download your OLL progress before moving devices or clearing browser
          data. This record is separate from lessons, cube checkpoints and timer
          history. Guided repetitions measure practice with the displayed moves,
          not memorization or physical solve speed.
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download OLL progress
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
          Case revision 1 · OLL numbering and conventional algorithms checked
          against the{" "}
          <a href={OLL_SOURCE} target="_blank" rel="noreferrer">
            CubeSkills reference by Feliks Zemdegs and Andy Klise
          </a>
          . Our explanations and diagrams are independently authored. These
          face-turn versions keep the cube orientation fixed; slice moves and
          rotations are expanded, so some sequences are longer than
          speed-focused finger-trick versions. These prepared exercises end in a
          valid PLL case, not a fully solved cube. Every case is verified with
          the cube engine before playback.
        </p>
        <p>
          The Cross group contains seven corner-orientation cases. The Line,
          Angle and Dot groups cover the remaining edge orientations. All 57 OLL
          cases are included. Beginner F2L guided setups are available from
          Learn F2L; OLL recognition drills remain later M4 work.
        </p>
      </details>
    </>
  );
}
