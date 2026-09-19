import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { compilePlayback, describeMove, inverse, type CubeState } from "@the-cube/cube-core";
import { ThreeRenderer } from "./renderer";
import type { Preferences } from "./preferences";

interface PlayerProps {
  input: CubeState;
  moves: string[];
  preferences: Preferences;
  palette?: 'original' | 'distinct';
  initialStep?: number;
  exercise?: boolean;
  onStep?: (step: number, practiced: boolean) => void;
  onMistake?: () => void;
  exerciseName?: string;
  playLabel?: string;
  completionText?: string | undefined;
  guideForStep?: (step: number, state: CubeState) => ReactNode;
}
export function SequencePlayer(props: PlayerProps) {
  // Saved callbacks may change every step; only new content resets the player.
  return <Playback key={`${props.input.size}:${props.input.facelets}:${props.moves.join(" ")}`} {...props} />;
}
function Playback({ input, moves, preferences, palette = 'original', initialStep = 0, exercise = false,
  onStep, onMistake, exerciseName = "Lesson exercise", playLabel = "Play solution", completionText, guideForStep }: PlayerProps) {
  const { states, moves: parsed } = useMemo(() => compilePlayback(input, moves), [input.size, input.facelets, moves.join(" ")]);
  const [cursor, setCursor] = useState(Math.max(0, Math.min(Number.isFinite(initialStep) ? Math.trunc(initialStep) : 0, moves.length)));
  const [busy, setBusy] = useState(false), [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1), [loop, setLoop] = useState(false);
  const [choice, setChoice] = useState("R"), [feedback, setFeedback] = useState(""), [viewError, setViewError] = useState("");
  const [systemMotion, setSystemMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [still, setStill] = useState(false);
  const reducedMotion = preferences.reducedMotion || systemMotion || still;
  const host = useRef<HTMLDivElement>(null), section = useRef<HTMLElement>(null), view = useRef<ThreeRenderer | null>(null);
  const lock = useRef(false), current = useRef(cursor), generation = useRef(0), alive = useRef(true), visible = useRef(true);
  const callback = useRef(onStep);
  callback.current = onStep;
  const currentLoop = useRef(loop);
  currentLoop.current = loop;
  const autoplay = useRef(false);
  const scheduled = useRef<ReturnType<typeof setTimeout> | null>(null);
  function stopAutoplay() {
    autoplay.current = false;
    if (scheduled.current !== null) clearTimeout(scheduled.current);
    scheduled.current = null;
    setPlaying(false);
  }
  function interrupt() {
    generation.current++;
    view.current?.interrupt();
    view.current?.setState(states[current.current]!);
    lock.current = false;
    setBusy(false);
  }
  function pause() {
    stopAutoplay();
    interrupt();
  }
  useEffect(() => {
    alive.current = true;
    try {
      view.current = new ThreeRenderer(host.current!, { reducedMotion, labels: true, palette });
      view.current.setState(states[current.current]!);
    } catch {
      setViewError("3D is unavailable in this browser. The face grids and move instructions still work.");
    }
    return () => {
      alive.current = false;
      autoplay.current = false;
      if (scheduled.current !== null) clearTimeout(scheduled.current);
      generation.current++;
      view.current?.dispose();
      view.current = null;
    };
  }, []);
  useEffect(() => {
    pause();
    view.current?.configure({ reducedMotion, labels: true, palette });
  }, [reducedMotion, palette]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemMotion(media.matches);
    media.addEventListener("change", change);
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", hidden);
    const observer = new IntersectionObserver(entries => {
      visible.current = entries[0]?.isIntersecting ?? false;
      if (!visible.current) pause();
    });
    observer.observe(section.current!);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", hidden);
      observer.disconnect();
    };
  }, []);
  async function go(target: number, practiced = false, animate = true) {
    if (lock.current || target < 0 || target > moves.length || target === current.current) return;
    lock.current = true;
    setBusy(true);
    setFeedback("");
    const before = current.current, operation = ++generation.current;
    try {
      const move = parsed[target > before ? before : target];
      if (animate && view.current && move && Math.abs(target - before) === 1)
        await view.current.animate(states[before]!, target > before ? move : inverse(move), states[target]!, 320 / speed);
      else view.current?.setState(states[target]!);
      if (!alive.current || generation.current !== operation) return;
      current.current = target;
      setCursor(target);
      callback.current?.(target, practiced);
      if (target === moves.length && !currentLoop.current) stopAutoplay();
    } catch {
      if (alive.current && generation.current === operation) {
        stopAutoplay();
        view.current?.setState(states[before]!);
        setFeedback("The move was interrupted. Your last completed step is preserved.");
      }
    } finally {
      if (alive.current && generation.current === operation) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  function seek(target: number) {
    pause();
    void go(target, false, false);
  }
  useEffect(() => {
    if (!playing || busy || !moves.length || document.hidden || !visible.current) return;
    if (cursor === moves.length && !loop) { stopAutoplay(); return; }
    const timer = setTimeout(() => {
      if (!autoplay.current || document.hidden || !visible.current) return;
      void go(current.current === moves.length ? 0 : current.current + 1, false, current.current !== moves.length);
    }, 650 / speed);
    scheduled.current = timer;
    return () => clearTimeout(timer);
  }, [playing, busy, cursor, speed, loop]);
  function attempt() {
    pause();
    if (choice !== moves[current.current]) {
      setFeedback(`Try ${moves[current.current]}. The cube has not changed.`);
      onMistake?.();
      return;
    }
    void go(current.current + 1, true);
  }
  return (
    <section
      className="sequence-player"
      ref={section}
      data-motion={reducedMotion ? "reduce" : "full"}
      aria-label={exercise ? exerciseName : "Solution playback"}
    >
      <div className="playback-scene">
        <div className="playback-status">
          <span>
            Step <b data-testid="playback-step">{cursor}</b> / {moves.length}
          </span>
          <span>
            {cursor === moves.length
              ? "Complete"
              : `${input.size}×${input.size} · Follow the face labels`}
          </span>
        </div>
        <div className="cube-view" ref={host} />
        {viewError && <p role="status">{viewError}</p>}
        <button className="quiet" onClick={() => view.current?.resetView()}>
          Reset viewing angle
        </button>
      </div>
      <div className="playback-guide">
        {guideForStep?.(cursor, states[cursor]!)}
        <p className="eyebrow">
          {cursor === moves.length ? "SEQUENCE COMPLETE" : "NEXT MOVE"}
        </p>
        <h3 className="next-move" data-testid="next-move">
          {moves[cursor] ?? "✓"}
        </h3>
        <p>
          {moves[cursor]
            ? describeMove(moves[cursor]!, input.size)
            : (completionText ??
              (exercise
                ? "You have reached the end. Apply every move yourself to record this lesson as practiced."
                : "Sequence complete. Rewind to explore the moves again."))}
        </p>
        <div className="actions playback-actions">
          <button
            className="secondary"
            disabled={busy || cursor === 0}
            onClick={() => {
              stopAutoplay();
              void go(cursor - 1);
            }}
          >
            Previous
          </button>
          <button
            disabled={busy || cursor === moves.length}
            onClick={() => {
              stopAutoplay();
              void go(cursor + 1);
            }}
          >
            {exercise ? "Show next move" : "Next move"}
          </button>
          {(
            <button
              className="secondary"
              disabled={!moves.length}
              onClick={() => {
                if (playing) pause();
                else { if (current.current === moves.length) seek(0); autoplay.current = true; setPlaying(true); }
              }}
            >
              {playing ? "Pause" : exercise ? "Play demonstration" : playLabel}
            </button>
          )}
          <button
            className="quiet"
            disabled={cursor === 0 && !busy}
            onClick={() => seek(0)}
          >
            Restart
          </button>
        </div>
        <label className="playback-timeline">
          Move timeline  -  {cursor} of {moves.length}
          <input type="range" min={0} max={moves.length} step={1} value={cursor}
            disabled={!moves.length} aria-label="Move timeline"
            aria-valuetext={`Step ${cursor} of ${moves.length}${moves[cursor] ? `, next ${moves[cursor]}` : ", complete"}`}
            onChange={event => seek(Number(event.target.value))} />
        </label>
        <div className="playback-options">
          <label className="playback-speed">Playback speed
            <select value={speed} onChange={event => { pause(); setSpeed(Number(event.target.value)); }}>
              <option value={0.5}>0.5× · Slow</option>
              <option value={1}>1× · Comfortable</option>
              <option value={2}>2× · Quick</option>
            </select>
          </label>
          <label className="playback-check"><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)} /> Loop sequence</label>
          <label className="playback-check"><input type="checkbox" checked={reducedMotion} disabled={preferences.reducedMotion || systemMotion} onChange={event => setStill(event.target.checked)} /> Reduce motion</label>
        </div>
        {exercise && (
          <div className="exercise-input">
            <label>
              Your move
              <select
                value={choice}
                onChange={(event) => setChoice(event.target.value)}
                disabled={busy || cursor === moves.length}
              >
                {[...new Set([..."URFDLB"].flatMap(face =>
                  ["", "'", "2"].map(suffix => face + suffix)).concat(moves))].map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
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
              <button type="button" className={`playback-token ${index === cursor ? "current-token" : ""}`}
                aria-label={`Go to move ${index + 1}: ${move}`} aria-current={index === cursor ? "step" : undefined}
                onClick={() => seek(index)}
                key={index}
              >
                {move}{" "}
              </button>
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
                style={{ gridTemplateColumns: `repeat(${input.size},1fr)` }}
              >
                {[
                  ...states[cursor]!.facelets.slice(index * input.size ** 2, (index + 1) * input.size ** 2),
                ].map((color, i) => (
                  <span
                    key={i}
                    className={`sticker color-${color}`}
                    aria-label={`${face} row ${Math.floor(i / input.size) + 1} column ${(i % input.size) + 1}: ${color}`}
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
