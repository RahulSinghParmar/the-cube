<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { createController } from '../controller';
  let host, control;
  let state = $state(null);
  onMount(() => {
    let disposed = false;
    const initialize = () => { if (!disposed) control = createController(host, value => state = value); };
    let script;
    if (window.THREE) initialize();
    else {
      script = document.createElement('script');
      script.src = `${base}/assets/three.js`;
      script.onload = initialize;
      script.onerror = initialize;
      document.head.append(script);
    }
    return () => { disposed = true; control?.dispose(); script?.remove(); };
  });
</script>
<svelte:head><title>The Cube · Svelte evaluation</title></svelte:head>
<p>LOCAL EVALUATION · SVELTEKIT</p>
<h1>See what each move does.</h1>
<p>Same cube engine, same theme. This prototype does not read or write your saved progress.</p>
<nav aria-label="Evaluation routes"><a href={`${base}/react/react/index.html`}>React comparison</a><a href={`${base}/cubing/`}>cubing.js comparison</a><a href={`${base}/components/`}>Component evaluation</a><a href="/the-cube/menu.html#/explore">Production player</a></nav>
<div class="controls"><label>Puzzle <select aria-label="Puzzle" disabled={!state} onchange={e => control.size(+e.currentTarget.value)}><option value="2">2×2</option><option value="3" selected>3×3</option><option value="4">4×4</option><option value="5">5×5</option></select></label></div>
<section class="player" aria-label="Sequence playback">
  <div class="scene" bind:this={host}></div>
  <div>
    {#if state}
      <h2>Explore the sequence</h2>
      <output data-testid="step">{state.step}</output><p>of {state.count} moves</p>
      <p class="next">{state.next}</p><p>{state.explanation}</p>
      <div class="controls">
        <button disabled={state.busy || !state.step} onclick={() => control.next(-1)}>Previous</button>
        <button disabled={state.busy || state.step === state.count} onclick={() => control.next(1)}>Next move</button>
        <button onclick={() => control.toggle()}>{state.playing ? 'Pause' : 'Play'}</button>
        <button onclick={() => control.seek(0)}>Rewind</button>
      </div>
      <label>Move timeline <input aria-label="Move timeline" type="range" min="0" max={state.count} value={state.step} oninput={e => control.seek(+e.currentTarget.value)} /></label>
      <div class="controls"><label>Speed <select aria-label="Speed" onchange={e => control.speed(+e.currentTarget.value)}><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
      <label><input type="checkbox" checked={state.reduced} onchange={e => control.reduce(e.currentTarget.checked)} />Reduce motion</label></div>
      {#if state.error}<p role="status">{state.error}</p>{/if}
      <details><summary>Facelet state</summary><p class="facelets" data-testid="facelets">{state.facelets}</p></details>
    {:else}<p>Preparing playback…</p>{/if}
  </div>
</section>
