<script>
  import { base } from '$app/paths';
  import '../shared.css';
  let { children } = $props();
  let offline = $state('');
  async function enableOffline() {
    try {
      const registration = await navigator.serviceWorker.register(`${base}/service-worker.js`, {scope: `${base}/`});
      const worker = registration.installing;
      if(worker) await new Promise(resolve => worker.addEventListener('statechange',()=>{if(['installed','activated','redundant'].includes(worker.state))resolve();}));
      offline = registration.active && registration.waiting ? 'Update ready. Close evaluation tabs and reopen.' : 'Offline evaluation ready. Reload to use the cache.';
    } catch { offline = 'Offline setup failed. Keep this evaluation online.'; }
  }
</script>
<svelte:head>
  <link rel="stylesheet" href={`${base}/assets/app-theme.css`} />
</svelte:head>
<a class="skip" href="#main">Skip to content</a>
<main id="main">{@render children()}</main>
<footer><button onclick={enableOffline}>Enable offline evaluation</button><p role="status">{offline}</p></footer>
