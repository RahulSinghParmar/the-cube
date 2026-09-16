import "./learning.css";
import "./trainer.css";
import "./f2l.css";
import { useEffect, useState } from "react";
import {
  F2L_CASES,
  F2L_GROUPS,
  F2L_SOURCE,
  f2lCase,
  f2lInput,
  f2lMoves,
  f2lPairGuide,
  verifyF2L,
  newF2LProgress,
  newF2LRecord,
  recordF2LStep,
  validateF2LProgress,
  type F2LId,
  type F2LGroup,
  type F2LRecord,
} from "@the-cube/academy";
import type { Preferences } from "./preferences";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  useLearningStorage,
  SaveRecovery,
  RestoreLearning,
} from "./learning-storage";

export function F2LPage({ preferences }: { preferences: Preferences }) {
  const store = useLearningStorage(
    `the-cube-f2l-v1:${learningScope}`,
    newF2LProgress(),
    validateF2LProgress,
  );
  const [mode, setMode] = useState<"watch" | "practice">("watch");
  const [group, setGroup] = useState<F2LGroup | "all">("all");
  const [generation, setGeneration] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(innerWidth >= 900);
  const id = store.value.selected,
    item = f2lCase(id),
    moves = f2lMoves(id),
    progress = store.value.cases[id] ?? newF2LRecord();
  const learned = F2L_CASES.filter(
    (c) => (store.value.cases[c.id]?.repetitions ?? 0) > 0,
  ).length;
  let verificationError = "";
  try {
    verifyF2L(id);
  } catch {
    verificationError =
      "This setup could not be verified. Choose another setup and report this issue.";
  }
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
  }, []);
  function choose(next: F2LId) {
    store.save({ ...store.value, selected: next });
    setMode("watch");
    if (innerWidth < 900) setLibraryOpen(false);
  }
  function saveRecord(record: F2LRecord) {
    store.save({
      ...store.value,
      cases: { ...store.value.cases, [id]: record },
    });
  }
  function repeat() {
    saveRecord({ ...progress, step: 0, practiced: 0 });
    setMode("practice");
    setGeneration((v) => v + 1);
  }
  return (
    <>
      <p className="eyebrow">ALGORITHM TRAINER · F2L</p>
      <h1 tabIndex={-1}>Two pieces. One pair.</h1>
      <p>
        F2L means first two layers. Match a corner with its edge, then place
        them together. Work through 12 guided setups, from simple insertions to
        pieces trapped in a slot.
      </p>
      <div className="actions">
        <a className="file-button" href="#/train">
          PLL library →
        </a>
        <a className="file-button" href="#/oll">
          OLL library →
        </a>
        <a className="file-button" href="#/learn">
          Beginner lessons →
        </a>
      </div>
      <SaveRecovery store={store} />
      <details className="lesson-notes f2l-intro">
        <summary>New to F2L? Start here</summary>
        <ol>
          <li>
            <b>Find:</b> the yellow–green–red corner belongs between those three
            centers. Its partner is the green–red edge.
          </li>
          <li>
            <b>Pair:</b> use the top layer and the open front-right slot to
            arrange the pieces. Touching is not enough: the side colors need to
            match.
          </li>
          <li>
            <b>Insert:</b> put both pieces in their slot together. Check the
            completed sequence, because individual turns can temporarily disturb
            solved pieces.
          </li>
        </ol>
        <p>
          These drills keep white on top (U), yellow underneath (D), green in
          front (F) and red on the right (R), just like our other trainers. The
          solved cross is yellow. If you usually solve a white cross, follow the
          center letters here rather than copying your usual colors.
        </p>
        <p>
          On a physical cube, solve the cross first, then repeat the pairing
          process for all four slots. These prepared exercises teach one
          front-right pair at a time; they are not a solver for any scramble or
          the full 41-case catalog.
        </p>
      </details>
      <div className="pll-overview">
        <span>
          <b>{learned}</b> / 12 setups practiced
        </span>
        <span>Saved on this device</span>
      </div>
      <div className="pll-layout">
        <aside>
          <label className="pll-picker">
            Choose an F2L setup
            <select
              aria-label="Choose an F2L setup"
              value={id}
              onChange={(e) => choose(e.target.value as F2LId)}
            >
              {F2L_CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number}. {c.title}
                </option>
              ))}
            </select>
          </label>
          <details
            className="pll-library"
            open={libraryOpen}
            onToggle={(e) => setLibraryOpen(e.currentTarget.open)}
          >
            <summary>Browse 12 guided setups</summary>
            <label>
              Filter setups
              <select
                aria-label="Filter setups"
                value={group}
                onChange={(e) => setGroup(e.target.value as F2LGroup | "all")}
              >
                <option value="all">All groups</option>
                {Object.entries(F2L_GROUPS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="f2l-cases" role="group" aria-label="F2L setups">
              {F2L_CASES.filter(
                (c) => group === "all" || group === c.group,
              ).map((c) => (
                <button
                  key={c.id}
                  className="secondary pll-case f2l-case"
                  aria-pressed={id === c.id}
                  onClick={() => choose(c.id)}
                >
                  <span className="f2l-number" aria-hidden="true">
                    {String(c.number).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{c.title}</strong>
                    <small>
                      {(store.value.cases[c.id]?.repetitions ?? 0) > 0
                        ? "Practiced ✓"
                        : store.value.cases[c.id]?.practiced
                          ? "In progress"
                          : F2L_GROUPS[c.group]}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </details>
        </aside>
        <article className="pll-workspace">
          <div className="pll-case-heading">
            <div>
              <p className="eyebrow">
                SETUP {item.number} · {F2L_GROUPS[item.group]}
              </p>
              <h2 data-testid="f2l-case-title">{item.title}</h2>
              <p>{item.explanation}</p>
            </div>
          </div>
          <div className="pll-orientation">
            <b>Target: yellow–green–red corner + green–red edge.</b> Their home
            is the front-right slot. Keep white U on top and green F in front.
            The yellow cross and other three pairs start solved and return after
            the whole sequence.
          </div>
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
              ? "Watch slowly, pause, or step backward. Watching does not count as a practice repetition."
              : "Choose and apply each move yourself. A wrong choice leaves the cube unchanged. Show next move is a demonstration; go back and apply that move yourself for practice credit."}
          </p>
          {verificationError ? (
            <p className="error" role="alert">
              {verificationError}
            </p>
          ) : (
            <SequencePlayer
              key={`${id}:${mode}:${generation}`}
              input={f2lInput(id)}
              moves={moves}
              preferences={preferences}
              exercise={mode === "practice"}
              initialStep={mode === "practice" ? progress.step : 0}
              exerciseName="F2L practice"
              completionText="The pair is home. The cross and all four pairs are solved; the last layer still needs OLL and PLL. Only moves you applied yourself count toward a guided repetition."
              guideForStep={(step, state) => {
                const phase = [...item.phases]
                  .reverse()
                  .find((p) => p.start <= step)!;
                return (
                  <div className="f2l-step-guide">
                    <p className="eyebrow">
                      {step === moves.length ? "CHECK THE PAIR" : phase.title}
                    </p>
                    <p>
                      {step === moves.length
                        ? "Yellow faces down. The green and red stickers match the front and right centers."
                        : phase.text}
                    </p>
                    <details className="pll-piece-guide">
                      <summary>Find the two pieces at this step</summary>
                      <ul>
                        {f2lPairGuide(state).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <p>
                        Drag the cube to inspect it; Reset viewing angle returns
                        to U on top and F in front. Letters name the sticker
                        colors, not their current positions.
                      </p>
                    </details>
                  </div>
                );
              }}
              onStep={(step, manual) => {
                if (mode === "practice")
                  saveRecord(recordF2LStep(id, progress, step, manual));
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
                  F2L_CASES[
                    (F2L_CASES.findIndex((c) => c.id === id) + 1) %
                      F2L_CASES.length
                  ]!.id,
                )
              }
            >
              Next setup →
            </button>
          </div>
        </article>
      </div>
      <details className="lesson-notes">
        <summary>Progress backups & learning sources</summary>
        <p>
          Progress is saved separately from your simulator, timer, lessons, PLL
          and OLL records. Guided repetitions measure following displayed moves,
          not memorization or physical solve speed.
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download F2L progress
          </button>
          <RestoreLearning
            restore={async (file) => {
              if (await store.restore(file)) {
                setMode("practice");
                setGeneration((v) => v + 1);
              }
            }}
          />
        </div>
        <p>
          Revision 1 · This beginner path uses conventional F2L triggers. The
          explanations, lesson ordering and prepared states are
          project-authored. Our setup numbers are lesson numbers, not standard
          F2L case numbers. See the{" "}
          <a href={F2L_SOURCE} target="_blank" rel="noreferrer">
            CubeSkills intuitive F2L tutorial
          </a>{" "}
          and its{" "}
          <a
            href="https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf"
            target="_blank"
            rel="noreferrer"
          >
            algorithm reference by Feliks Zemdegs and Andy Klise
          </a>{" "}
          for further study. No third-party diagrams or lesson text are
          reproduced.
        </p>
        <p>
          Every setup is checked before playback. The full 41-case catalog,
          other slot angles and recognition drills remain future extensions.
        </p>
      </details>
    </>
  );
}
