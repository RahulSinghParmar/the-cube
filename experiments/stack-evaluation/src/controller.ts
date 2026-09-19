import { solved, compilePlayback, describeMove, inverse, type Size } from '../../../packages/cube-core/src/index';
import { ThreeRenderer } from '../../../apps/web/src/renderer';

export const sequences: Record<number, string[]> = {
  2: ['R','U',"R'","U'"], 3: ['R','U',"R'","U'",'M',"M'",'x',"x'"],
  4: ['Rw','U',"Rw'","U'",'2R',"2R'",'x',"x'"],
  5: ['3Rw','U',"3Rw'","U'",'M',"M'",'x',"x'"]
};
export function createController(host: HTMLElement, changed: (state: any) => void) {
  let size: Size = 3, step = 0, speed = 1, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playing = false, busy = false, generation = 0, disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frames = compilePlayback(solved(size), sequences[size]!);
  let renderer: ThreeRenderer | undefined;
  let error = '';
  try { renderer = new ThreeRenderer(host, { reducedMotion: reduced, labels: true }); }
  catch { error = '3D unavailable. Move descriptions and facelets remain available.'; }
  function publish() {
    if (disposed) return;
    changed({ size, step, speed, reduced, playing, busy, error, count: frames.moves.length,
      next: sequences[size]![step] ?? 'Complete', facelets: frames.states[step]!.facelets,
      explanation: step < frames.moves.length ? describeMove(sequences[size]![step]!, size) : 'Sequence complete. Rewind to explore it again.' });
  }
  function stop() {
    playing = false; clearTimeout(timer); generation++; busy = false;
    renderer?.interrupt(); renderer?.setState(frames.states[step]!); publish();
  }
  function schedule() { if (playing) timer = setTimeout(() => void go(step + 1), 650 / speed); }
  async function go(target: number, animate = true) {
    if (busy || disposed || target < 0 || target > frames.moves.length) return;
    const before = step, ticket = ++generation; busy = true; publish();
    try {
      const move = frames.moves[target > before ? before : target];
      if (renderer && animate && move && Math.abs(target - before) === 1)
        await renderer.animate(frames.states[before]!, target > before ? move : inverse(move), frames.states[target]!, 320 / speed);
      else renderer?.setState(frames.states[target]!);
      if (generation !== ticket || disposed) return;
      step = target; busy = false;
      if (step === frames.moves.length) playing = false;
      publish(); schedule();
    } catch { if (generation === ticket) stop(); }
  }
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => { stop(); reduced = media.matches; renderer?.configure({reducedMotion: reduced, labels:true}); publish(); };
  const hidden = () => { if (document.hidden) stop(); };
  media.addEventListener('change', motion); document.addEventListener('visibilitychange', hidden);
  renderer?.setState(frames.states[0]!); publish();
  return {
    size(value: number) { stop(); size = value as Size; frames = compilePlayback(solved(size), sequences[size]!); step = 0; renderer?.setState(frames.states[0]!); publish(); },
    seek(value: number) { stop(); void go(value, false); },
    next(delta: number) { stop(); void go(step + delta); },
    toggle() { if (playing) stop(); else { if (step === frames.moves.length) { step = 0; renderer?.setState(frames.states[0]!); } playing = true; publish(); schedule(); } },
    speed(value: number) { stop(); speed = value; publish(); },
    reduce(value: boolean) { stop(); reduced = value || media.matches; renderer?.configure({reducedMotion: reduced, labels:true}); publish(); },
    dispose() { stop(); disposed = true; renderer?.dispose(); media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', hidden); }
  };
}
