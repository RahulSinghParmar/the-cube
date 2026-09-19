import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createController } from '../src/controller';
import '../src/shared.css';
function App() {
  const host = useRef(null), control = useRef(null);
  const [state, setState] = useState(null);
  useEffect(() => { control.current = createController(host.current, setState); return () => control.current.dispose(); }, []);
  return <><a className="skip" href="#main">Skip to content</a><main id="main">
    <p>LOCAL EVALUATION · REACT</p><h1>See what each move does.</h1>
    <p>Same cube engine, same theme. This prototype does not read or write your saved progress.</p>
    <nav aria-label="Evaluation routes"><a href="/the-cube/evaluation/">Svelte comparison</a><a href="/the-cube/menu.html#/explore">Production player</a></nav>
    <div className="controls"><label>Puzzle <select aria-label="Puzzle" defaultValue="3" onChange={e => control.current.size(+e.target.value)}>{[2,3,4,5].map(n=><option key={n} value={n}>{n}×{n}</option>)}</select></label></div>
    <section className="player" aria-label="Sequence playback"><div className="scene" ref={host}/><div>{state ? <>
      <h2>Explore the sequence</h2><output data-testid="step">{state.step}</output><p>of {state.count} moves</p><p className="next">{state.next}</p><p>{state.explanation}</p>
      <div className="controls"><button disabled={state.busy || !state.step} onClick={()=>control.current.next(-1)}>Previous</button><button disabled={state.busy || state.step === state.count} onClick={()=>control.current.next(1)}>Next move</button><button onClick={()=>control.current.toggle()}>{state.playing?'Pause':'Play'}</button><button onClick={()=>control.current.seek(0)}>Rewind</button></div>
      <label>Move timeline <input aria-label="Move timeline" type="range" min="0" max={state.count} value={state.step} onChange={e=>control.current.seek(+e.target.value)}/></label>
      <div className="controls"><label>Speed <select aria-label="Speed" defaultValue="1" onChange={e=>control.current.speed(+e.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label><label><input type="checkbox" checked={state.reduced} onChange={e=>control.current.reduce(e.target.checked)}/>Reduce motion</label></div>
      {state.error && <p role="status">{state.error}</p>}<details><summary>Facelet state</summary><p className="facelets" data-testid="facelets">{state.facelets}</p></details>
    </> : <p>Preparing playback…</p>}</div></section>
  </main></>;
}
createRoot(document.getElementById('app')).render(<App/>);
