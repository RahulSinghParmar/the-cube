import "./learning.css";
import "./trainer.css";
import "./recognition.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PLL_CASES,
  PLL_EXPLANATIONS,
  pllCase,
  pllInput,
  pllMoves,
  pllPieceGuide,
  verifyPLL,
  newRecognitionProgress,
  validateRecognitionProgress,
  recordRecognition,
  recognitionStats,
  pickRecognitionCase,
  type PLLId,
  type RecognitionAttempt,
} from "@the-cube/academy";
import type { Preferences } from "./preferences";
import { ThreeRenderer } from "./renderer";
import { CasePattern } from "./CasePattern";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  useLearningStorage,
  SaveRecovery,
  RestoreLearning,
} from "./learning-storage";

type Round = {
  id: string;
  caseId: PLLId;
  timed: boolean;
  started: number | null;
};
function QuestionCube({
  id,
  ready,
  preferences,
}: {
  id: PLLId;
  ready: () => void;
  preferences: Preferences;
}) {
  const host = useRef<HTMLDivElement>(null),
    renderer = useRef<ThreeRenderer | null>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    try {
      renderer.current = new ThreeRenderer(host.current!, {
        reducedMotion: preferences.reducedMotion,
        labels: true,
      });
      renderer.current.setState(pllInput(id));
    } catch {
      setFallback(true);
    }
    const frame = requestAnimationFrame(ready);
    return () => {
      cancelAnimationFrame(frame);
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [id, ready, preferences.reducedMotion]);
  return (
    <div>
      <div
        className="cube-view"
        hidden={fallback}
        ref={host}
        role="img"
        aria-label="Unidentified PLL cube. Use the top diagram or six-face text alternative to inspect the stickers."
      />
      {fallback && (
        <p role="status">
          3D is unavailable. The pattern and face grids still work.
        </p>
      )}
      {!fallback && (
        <button className="quiet" onClick={() => renderer.current?.resetView()}>
          Reset viewing angle
        </button>
      )}
    </div>
  );
}
const duration = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
export function RecognitionPage({ preferences }: { preferences: Preferences }) {
  const store = useLearningStorage(
    `the-cube-pll-recognition-v1:${learningScope}`,
    newRecognitionProgress(),
    validateRecognitionProgress,
  );
  const [round, setRound] = useState<Round | null>(null),
    active = useRef<Round | null>(null);
  const [result, setResult] = useState<RecognitionAttempt | null>(null);
  const [answer, setAnswer] = useState<PLLId | "">("");
  const [review, setReview] = useState(false),
    [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0),
    [notice, setNotice] = useState("");
  const previous = useRef<PLLId | undefined>(undefined);
  const roundHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    roundHeading.current?.focus();
  }, [round?.id, result?.id]);
  const stats = recognitionStats(store.value.history);
  const beginClock = useCallback(() => {
    if (active.current && active.current.started === null) {
      active.current.started = performance.now();
      setReady(true);
    }
  }, []);
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
    const hidden = () => {
      if (document.hidden && active.current) {
        active.current = null;
        setRound(null);
        setReady(false);
        setNotice(
          "Round interrupted while the app was hidden. No attempt was recorded. Start a new round when ready.",
        );
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      active.current = null;
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  useEffect(() => {
    if (!round?.timed || !ready) return;
    const timer = setInterval(() => {
      if (active.current?.started !== null && active.current)
        setElapsed(performance.now() - active.current.started);
    }, 200);
    return () => clearInterval(timer);
  }, [round, ready]);
  function start() {
    try {
      const caseId = pickRecognitionCase(
        store.value.history,
        review,
        previous.current,
      );
      verifyPLL(caseId);
      const next = {
        id: crypto.randomUUID(),
        caseId,
        timed: store.value.timed,
        started: null,
      };
      previous.current = caseId;
      active.current = next;
      setRound(next);
      setResult(null);
      setAnswer("");
      setReady(false);
      setElapsed(0);
      setNotice("");
    } catch {
      setNotice(
        "A verified case could not be prepared. Please reload and try again.",
      );
    }
  }
  function submit(reveal = false) {
    const current = active.current;
    if (
      !current ||
      current.started === null ||
      document.hidden ||
      (!answer && !reveal)
    )
      return;
    active.current = null;
    const ms = Math.round(performance.now() - current.started);
    if (ms > 86400000) {
      setRound(null);
      setNotice("This round expired. No attempt was recorded.");
      return;
    }
    const attempt: RecognitionAttempt = {
      id: current.id,
      caseId: current.caseId,
      answer: reveal ? null : (answer as PLLId),
      at: Date.now(),
      elapsedMs: current.timed && !reveal ? ms : null,
    };
    store.save(recordRecognition(store.value, attempt));
    setResult(attempt);
    setRound(null);
    setReady(false);
  }
  return (
    <>
      <p className="eyebrow">PLL · RECOGNITION</p>
      <h1 tabIndex={-1}>Know the pattern.</h1>
      <p>
        Identify a random PLL case before revealing its name. Start untimed,
        then measure recognition when you feel ready.
      </p>
      <a href="#/train">← Back to guided PLL practice</a>
      <SaveRecovery store={store} />
      <div className="recognition-stats" aria-label="Recognition results">
        <span>
          <b>{stats.accuracy === null ? "—" : `${stats.accuracy}%`}</b> accuracy
        </span>
        <span>
          <b>
            {stats.correct} / {stats.total}
          </b>{" "}
          correct
        </span>
        <span>
          <b>{stats.medianMs === null ? "—" : duration(stats.medianMs)}</b>{" "}
          median correct time ({stats.timedCorrect} timed)
        </span>
      </div>
      <div className="recognition-options">
        <label>
          <input
            type="checkbox"
            checked={store.value.timed}
            disabled={Boolean(round)}
            onChange={(e) =>
              store.save({ ...store.value, timed: e.target.checked })
            }
          />{" "}
          Time my answers
        </label>
        <label>
          <input
            type="checkbox"
            checked={review}
            disabled={Boolean(round)}
            onChange={(e) => setReview(e.target.checked)}
          />{" "}
          Give missed cases extra practice
        </label>
      </div>
      <p className="recognition-note">
        White U on top · green F in front. Timing starts when the pattern is
        ready. Leaving or reloading an unfinished round records nothing. Reveals
        count as missed attempts.
      </p>
      {notice && <p role="status">{notice}</p>}
      {!round && !result && <button onClick={start}>Start recognition</button>}
      {round && (
        <section
          className="recognition-question"
          aria-label="Recognition question"
        >
          <div className="recognition-prompt">
            <h2 ref={roundHeading} tabIndex={-1}>
              Which PLL case is this?
            </h2>
            <span data-testid="recognition-clock">
              {!ready
                ? "Preparing…"
                : round.timed
                  ? duration(elapsed)
                  : "Untimed"}
            </span>
          </div>
          <div className="recognition-visual">
            <QuestionCube
              key={round.id}
              id={round.caseId}
              ready={beginClock}
              preferences={preferences}
            />
            <figure>
              <CasePattern id={round.caseId} />
              <figcaption>Top view · B above · F below</figcaption>
            </figure>
          </div>
          <details>
            <summary>View six faces · text alternative</summary>
            <div className="recognition-net">
              {["U", "R", "F", "D", "L", "B"].map((face, f) => (
                <div key={face}>
                  <b>{face}</b>
                  <div className="recognition-face">
                    {pllInput(round.caseId)
                      .facelets.slice(f * 9, f * 9 + 9)
                      .split("")
                      .map((letter, i) => (
                        <span className={`sticker color-${letter}`} key={i}>
                          {letter}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="pll-picker">
              Your answer
              <select
                aria-label="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value as PLLId | "")}
              >
                <option value="">Choose a case</option>
                {PLL_CASES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </label>
            <div className="actions">
              <button disabled={!ready || !answer}>Check answer</button>
              <button
                type="button"
                className="secondary"
                disabled={!ready}
                onClick={() => submit(true)}
              >
                Reveal case
              </button>
            </div>
          </form>
        </section>
      )}
      {result && (
        <section className="recognition-feedback" aria-label="Answer feedback">
          <h2 tabIndex={-1} ref={roundHeading}>
            {result.answer === result.caseId
              ? "Correct"
              : result.answer === null
                ? "Revealed"
                : "Not quite"}{" "}
            — {result.caseId}
          </h2>
          <p>
            {result.answer === null
              ? "You revealed this case. It is recorded as missed."
              : `Your answer: ${result.answer}. ${result.answer === result.caseId ? "You identified the pattern." : `The correct case is ${result.caseId}. Compare the piece destinations below.`}`}
            {result.elapsedMs !== null
              ? ` Recognition time: ${duration(result.elapsedMs)}.`
              : " No time recorded."}
          </p>
          <p>{PLL_EXPLANATIONS[pllCase(result.caseId).group]}</p>
          <ul>
            {pllPieceGuide(result.caseId).map((piece) => (
              <li key={piece.from}>
                The <b>{piece.from}</b> belongs at the <b>{piece.to}</b>.
              </li>
            ))}
          </ul>
          <button onClick={start} disabled={Boolean(store.error)}>
            Next pattern
          </button>
          {store.error && (
            <p className="error">
              Save or recover this result above before starting another round.
            </p>
          )}
          <details>
            <summary>Explain with 3D playback</summary>
            <SequencePlayer
              key={result.id}
              input={pllInput(result.caseId)}
              moves={pllMoves(result.caseId)}
              preferences={preferences}
              completionText="The case is solved. Playback does not change your recognition result or guided repetitions."
            />
          </details>
        </section>
      )}
      <details className="lesson-notes">
        <summary>Recognition history & backups</summary>
        <p>
          Accuracy includes incorrect answers and reveals. Median time uses
          correct timed answers only. Results describe these fixed-orientation
          patterns, not physical solves. We retain your latest 500 attempts; all
          statistics use that retained history. Extra practice weights mistakes
          and reveals from the latest 100 attempts, while keeping every case
          available.
        </p>
        <p>
          {stats.revealed} revealed · {stats.total} saved attempts
          {store.error ? " (current changes are only in memory)" : ""}
        </p>
        <div className="actions">
          <button className="secondary" onClick={store.backup}>
            Download recognition history
          </button>
          <RestoreLearning
            restore={async (file) => {
              if (await store.restore(file)) {
                active.current = null;
                setRound(null);
                setResult(null);
                setNotice(
                  "Recognition backup restored. Start a new round when ready.",
                );
              }
            }}
          />
        </div>
        <ol className="recognition-history">
          {store.value.history
            .slice()
            .reverse()
            .slice(0, 50)
            .map((entry) => (
              <li key={entry.id}>
                <b>{entry.caseId}</b> ·{" "}
                {entry.answer === null
                  ? "Revealed"
                  : entry.answer === entry.caseId
                    ? "Correct"
                    : `Answered ${entry.answer}`}{" "}
                ·{" "}
                {entry.elapsedMs === null
                  ? "Untimed"
                  : duration(entry.elapsedMs)}
                <small>{new Date(entry.at).toLocaleString()}</small>
              </li>
            ))}
        </ol>
        <p>
          Showing the latest 50 attempts. The backup includes all retained
          attempts. Guided PLL repetitions, lessons and timer data are stored
          separately.
        </p>
      </details>
    </>
  );
}
