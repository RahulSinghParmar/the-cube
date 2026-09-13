import "./learning.css";
import { useEffect, useState } from "react";
import {
  LESSONS,
  COURSE_SOURCE,
  lessonInput,
  lessonMoves,
  validateProgress,
  type CourseProgress,
} from "@the-cube/academy";
import type { Preferences } from "./preferences";
import { SequencePlayer } from "./SequencePlayer";
import {
  learningScope,
  SaveRecovery,
  RestoreLearning,
  useLearningStorage,
} from "./learning-storage";

export function LearnPage({ preferences }: { preferences: Preferences }) {
  useEffect(() => {
    document.querySelector<HTMLElement>("h1")?.focus();
  }, []);
  const store = useLearningStorage<CourseProgress>(
    `the-cube-lessons-v1:${learningScope}`,
    { version: 1, lessons: {} },
    validateProgress,
  );
  const [selected, setSelected] = useState(0),
    [restored, setRestored] = useState(0);
  const lesson = LESSONS[selected]!,
    moves = lessonMoves(lesson),
    progress = store.value.lessons[lesson.id];
  const completed = LESSONS.filter(
    (item) =>
      store.value.lessons[item.id]?.practiced === lessonMoves(item).length,
  ).length;
  return (
    <>
      <p className="eyebrow">BEGINNER COURSE · 3×3</p>
      <h1 tabIndex={-1}>One move at a time.</h1>
      <p>
        Eight guided exercises. Start with the basics, then build up a complete
        prepared solve.
      </p>
      <SaveRecovery store={store} />
      <div className="learning-heading">
        <span>
          {completed} / {LESSONS.length} lessons practiced
        </span>
        <a href="#/solve">Solve your own cube →</a>
      </div>
      <div className="lesson-layout">
        <nav className="lesson-list" aria-label="Beginner lessons">
          {LESSONS.map((item, index) => (
            <button
              key={item.id}
              className="secondary"
              aria-current={index === selected ? "step" : undefined}
              onClick={() => setSelected(index)}
            >
              <span className="lesson-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.title}</span>
              <span
                className="lesson-done"
                aria-label={
                  store.value.lessons[item.id]?.practiced ===
                  lessonMoves(item).length
                    ? "Practiced"
                    : "Not yet practiced"
                }
              >
                {store.value.lessons[item.id]?.practiced ===
                lessonMoves(item).length
                  ? "✓"
                  : "·"}
              </span>
            </button>
          ))}
        </nav>
        <article className="lesson-content">
          <p className="eyebrow">
            LESSON {selected + 1} / {LESSONS.length}
          </p>
          <h2>{lesson.title}</h2>
          <p className="lesson-goal">{lesson.goal}</p>
          {lesson.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <SequencePlayer
            key={`${lesson.id}:${restored}`}
            input={lessonInput(lesson)}
            moves={moves}
            preferences={preferences}
            exercise
            initialStep={progress?.step ?? 0}
            onStep={(step, practiced) => {
              const previous = store.value.lessons[lesson.id]?.practiced ?? 0;
              const earned =
                practiced && step === previous + 1 ? step : previous;
              store.save({
                version: 1,
                lessons: {
                  ...store.value.lessons,
                  [lesson.id]: { revision: 1, step, practiced: earned },
                },
              });
            }}
          />
          <p role="status" className="lesson-progress">
            {progress?.practiced === moves.length
              ? "Lesson practiced ✓"
              : `${progress?.practiced ?? 0} / ${moves.length} moves practiced yourself. Showing a move does not mark it practiced.`}{" "}
            {store.error
              ? "Progress has not been saved."
              : "Progress saves on this device."}
          </p>
          <div className="actions">
            <button
              className="secondary"
              disabled={selected === 0}
              onClick={() => setSelected(selected - 1)}
            >
              Previous lesson
            </button>
            <button
              disabled={selected === LESSONS.length - 1}
              onClick={() => setSelected(selected + 1)}
            >
              Next lesson
            </button>
          </div>
        </article>
      </div>
      <details className="lesson-notes">
        <summary>About this course & backups</summary>
        <p>
          Revision 1 · Original explanations with conventional beginner move
          sequences. Exercise setups, moves and stage boundaries are checked
          with the cube engine. These are prepared cases; a general two-phase
          solution is offered separately in Solve.
        </p>
        <p>
          <a href={COURSE_SOURCE} target="_blank" rel="noreferrer">
            Official Rubik’s beginner guide
          </a>{" "}
          provides another learning reference. This course is independently
          authored and is not affiliated with Rubik’s.
        </p>
        <button className="secondary" onClick={store.backup}>
          Download lesson progress
        </button>{" "}
        <RestoreLearning
          restore={async (file) => {
            if (await store.restore(file)) setRestored((value) => value + 1);
          }}
        />
      </details>
    </>
  );
}
