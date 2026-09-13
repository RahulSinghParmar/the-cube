import { useEffect, useMemo, useRef, useState } from "react";
import { apply, inverse, parseMove, type CubeState } from "@the-cube/cube-core";
import { moveDescription } from "@the-cube/academy";
import { ThreeRenderer } from "./renderer";
import type { Preferences } from "./preferences";

export function SequencePlayer({
  input,
  moves,
  preferences,
  initialStep = 0,
  exercise = false,
  onStep,
}: {
  input: CubeState;
  moves: string[];
  preferences: Preferences;
  initialStep?: number;
  exercise?: boolean;
  onStep?: (step: number, practiced: boolean) => void;
}) {
  const states = useMemo(() => {
    const all = [input];
    for (const token of moves)
      all.push(apply(all.at(-1)!, parseMove(token, 3)));
    return all;
  }, [input.facelets, moves.join(" ")]);
  const [cursor, setCursor] = useState(Math.min(initialStep, moves.length)),
    [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900),
    [choice, setChoice] = useState("R"),
    [feedback, setFeedback] = useState(""),
    [viewError, setViewError] = useState("");
  const host = useRef<HTMLDivElement>(null),
    view = useRef<ThreeRenderer | null>(null),
    lock = useRef(false),
    current = useRef(cursor),
    alive = useRef(true);
  const callback = useRef(onStep);
  callback.current = onStep;
  useEffect(() => {
    alive.current = true;
    try {
      view.current = new ThreeRenderer(host.current!, {
        reducedMotion:
          preferences.reducedMotion ||
          matchMedia("(prefers-reduced-motion: reduce)").matches,
        labels: true,
      });
      view.current.setState(states[current.current]!);
    } catch {
      setViewError(
        "3D is unavailable in this browser. The face grids and move instructions still work.",
      );
    }
    return () => {
      alive.current = false;
      view.current?.dispose();
      view.current = null;
    };
  }, [preferences.reducedMotion]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  async function go(target: number, practiced = false) {
    if (
      lock.current ||
      target < 0 ||
      target > moves.length ||
      target === current.current
    )
      return;
    lock.current = true;
    setBusy(true);
    setFeedback("");
    const before = current.current;
    try {
      const token = target > before ? moves[before] : moves[target];
      const move = token ? parseMove(token, 3) : null;
      if (view.current && move && Math.abs(target - before) === 1)
        await view.current.animate(
          states[before]!,
          target > before ? move : inverse(move),
          states[target]!,
        );
      else view.current?.setState(states[target]!);
      if (!alive.current) return;
      current.current = target;
      setCursor(target);
      callback.current?.(target, practiced);
      if (target === moves.length) setPlaying(false);
    } catch {
      if (alive.current) {
        setPlaying(false);
        view.current?.setState(states[before]!);
        setFeedback(
          "The move was interrupted. Your last completed step is preserved.",
        );
      }
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (!playing || busy || cursor >= moves.length) return;
    const timer = setTimeout(() => void go(current.current + 1), speed);
    return () => clearTimeout(timer);
  }, [playing, busy, cursor, speed]);
  function attempt() {
    setPlaying(false);
    if (choice !== moves[current.current]) {
      setFeedback(`Try ${moves[current.current]}. The cube has not changed.`);
      return;
    }
    void go(current.current + 1, true);
  }
  return (
    <section
      className="sequence-player"
      aria-label={exercise ? "Lesson exercise" : "Solution playback"}
    >
      <div className="playback-scene">
        <div className="playback-status">
          <span>
            Step <b data-testid="playback-step">{cursor}</b> / {moves.length}
          </span>
          <span>
            {cursor === moves.length
              ? "Complete"
              : "Keep U on top · F in front"}
          </span>
        </div>
        <div className="cube-view" ref={host} />
        {viewError && <p role="status">{viewError}</p>}
        <button className="quiet" onClick={() => view.current?.resetView()}>
          Reset viewing angle
        </button>
      </div>
      <div className="playback-guide">
        <p className="eyebrow">
          {cursor === moves.length ? "SEQUENCE COMPLETE" : "NEXT MOVE"}
        </p>
        <h3 className="next-move" data-testid="next-move">
          {moves[cursor] ?? "✓"}
        </h3>
        <p>
          {moves[cursor]
            ? moveDescription(moves[cursor]!)
            : exercise
              ? "You have reached the end. Apply every move yourself to record this lesson as practiced."
              : "All six faces are solved. Your original input remains saved separately."}
        </p>
        <div className="actions playback-actions">
          <button
            className="secondary"
            disabled={busy || cursor === 0}
            onClick={() => {
              setPlaying(false);
              void go(cursor - 1);
            }}
          >
            Previous
          </button>
          <button
            disabled={busy || cursor === moves.length}
            onClick={() => {
              setPlaying(false);
              void go(cursor + 1);
            }}
          >
            {exercise ? "Show next move" : "Next move"}
          </button>
          {!exercise && (
            <button
              className="secondary"
              disabled={cursor === moves.length}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? "Pause" : "Play solution"}
            </button>
          )}
          <button
            className="quiet"
            disabled={busy || cursor === 0}
            onClick={() => {
              setPlaying(false);
              void go(0);
            }}
          >
            Restart
          </button>
        </div>
        {!exercise && (
          <label className="playback-speed">
            Pause between moves
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            >
              <option value={1400}>Slow · 1.4 seconds</option>
              <option value={900}>Comfortable · 0.9 seconds</option>
              <option value={400}>Quick · 0.4 seconds</option>
            </select>
          </label>
        )}
        {exercise && (
          <div className="exercise-input">
            <label>
              Your move
              <select
                value={choice}
                onChange={(event) => setChoice(event.target.value)}
                disabled={busy || cursor === moves.length}
              >
                {[..."URFDLB"].flatMap((face) =>
                  ["", "'", "2"].map((suffix) => (
                    <option key={face + suffix} value={face + suffix}>
                      {face + suffix}
                    </option>
                  )),
                )}
              </select>
            </label>
            <button
              disabled={busy || cursor === moves.length}
              onClick={attempt}
            >
              Apply my move
            </button>
          </div>
        )}
        <p role="status" className="exercise-feedback">
          {feedback ||
            (busy
              ? "Turning…"
              : playing
                ? "Playing — pause whenever you need."
                : "Take your time. Each step can be reversed.")}
        </p>
        <details>
          <summary>Move sequence</summary>
          <p className="notation">
            {moves.map((move, index) => (
              <span
                key={index}
                className={index === cursor ? "current-token" : undefined}
              >
                {move}{" "}
              </span>
            ))}
          </p>
        </details>
      </div>
      <details className="playback-net">
        <summary>View all six faces · text alternative</summary>
        <div className="cube-net">
          {[..."URFDLB"].map((face, index) => (
            <div key={face}>
              <h3>{face}</h3>
              <div
                className="net-face"
                style={{ gridTemplateColumns: "repeat(3,1fr)" }}
              >
                {[
                  ...states[cursor]!.facelets.slice(index * 9, index * 9 + 9),
                ].map((color, i) => (
                  <span
                    key={i}
                    className={`sticker color-${color}`}
                    aria-label={`${face} row ${Math.floor(i / 3) + 1} column ${(i % 3) + 1}: ${color}`}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
