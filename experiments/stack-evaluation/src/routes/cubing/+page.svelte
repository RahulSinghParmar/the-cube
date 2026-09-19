<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  let host, player, indexer;
  let size = $state(3), step = $state(0), ready = $state(false), pattern = $state(''), error = $state('');
  const moves = ['R','U',"R'","U'"];
  let reduced = $state(false);
  async function load(value) {
    ready = false; size = value; step = 0;
    player.pause(); player.puzzle = `${size}x${size}x${size}`; player.alg = moves.join(' '); player.timestamp = 0;
    try {
      indexer = await player.experimentalModel.indexer.get();
      const start = performance.now();
      const canvases = () => Promise.race([
        player.experimentalCurrentCanvases(),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Candidate canvas readiness timed out.')),10000))
      ]);
      while (!(await canvases()).some(canvas => canvas.width > 0 && canvas.height > 0)) {
        if (performance.now() - start > 10000) throw new Error('Candidate canvas did not become ready.');
        await new Promise(requestAnimationFrame);
      }
      pattern = JSON.stringify((await player.experimentalModel.currentPattern.get()).patternData);
      ready = true;
    } catch(e) { error = String(e); }
  }
  async function seek(value) {
    player.pause(); step = value;
    player.timestamp = value === moves.length ? 'end' : indexer.indexToMoveStartTimestamp(value);
    pattern = JSON.stringify((await player.experimentalModel.currentPattern.get()).patternData);
  }
  onMount(() => {
    let disposed = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)'); reduced = media.matches;
    const hidden = () => { if (document.hidden) player?.pause(); };
    const motion = () => { reduced = media.matches; player?.pause(); };
    document.addEventListener('visibilitychange', hidden); media.addEventListener('change', motion);
    import('cubing/twisty').then(async ({TwistyPlayer}) => {
      if (disposed) return;
      player = new TwistyPlayer({puzzle:'3x3x3',alg:moves.join(' '),background:'none',controlPanel:'none',hintFacelets:'none',viewerLink:'none'});
      host.append(player); await load(3);
    }).catch(e => error = String(e));
    return () => { disposed = true; player?.pause(); player?.remove(); document.removeEventListener('visibilitychange', hidden); media.removeEventListener('change', motion); };
  });
</script>
<svelte:head><title>The Cube · cubing.js evaluation</title></svelte:head>
<p>LOCAL EVALUATION · CUBING.JS</p><h1>A second rendering option.</h1>
<nav><a href={`${base}/`}>Back to playback</a></nav>
<p>This isolated candidate uses cubing.js notation, state and rendering. Its experimental timeline API still needs a production adapter.</p>
<label>Puzzle <select aria-label="Puzzle" disabled={!ready} onchange={e=>load(+e.currentTarget.value)}>{#each [2,3,4,5] as n}<option value={n} selected={n===3}>{n}×{n}</option>{/each}</select></label>
<section class="player" aria-label="Candidate playback">
  <div bind:this={host}></div>
  <div><h2>R U R′ U′</h2><p data-testid="candidate-ready">{ready ? 'Ready' : 'Preparing 3D…'}</p>
    <p>Seek position: <output data-testid="step">{step}</output> / 4</p>
    <div class="controls"><button disabled={!ready || !step} onclick={()=>seek(step-1)}>Previous</button><button disabled={!ready || step===4} onclick={()=>seek(step+1)}>Next move</button><button disabled={!ready || reduced} onclick={()=>player.play()}>Play</button><button disabled={!ready} onclick={()=>player.pause()}>Pause</button><button disabled={!ready} onclick={()=>seek(0)}>Rewind</button></div>
    <label>Move timeline <input aria-label="Move timeline" type="range" min="0" max="4" value={step} disabled={!ready} oninput={e=>seek(+e.currentTarget.value)}/></label>
    <label>Speed <select aria-label="Speed" disabled={!ready} onchange={e=>player.tempoScale=+e.currentTarget.value}><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
    <p>Autoplay is disabled for OS reduced motion. Next, Previous and seeking are immediate. The seek counter describes manual positions; it does not follow candidate autoplay.</p>
    <details><summary>Candidate pattern</summary><p class="facelets" data-testid="pattern">{pattern}</p></details>
    {#if error}<p role="alert">{error}</p>{/if}
  </div>
</section>
