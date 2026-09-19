<script>
  import { Dialog } from 'bits-ui';
  import { onMount } from 'svelte';
  import { CircleHelp } from '@lucide/svelte';
  import { base } from '$app/paths';
  import './utilities.css';
  let mounted = $state(false);
  onMount(() => { mounted = true; });
</script>
<svelte:head><title>The Cube · Component evaluation</title></svelte:head>
<p>LOCAL EVALUATION · COMPONENTS</p><h1>Understand the controls.</h1>
<nav><a href={`${base}/`}>Back to playback</a></nav>
<p>Bits UI focus management, Tailwind utilities without a global reset, and a single Lucide icon using our theme.</p>
<Dialog.Root>
  <Dialog.Trigger disabled={!mounted} class="inline-flex items-center gap-2"><CircleHelp size={20} aria-hidden="true"/>Playback help</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="overlay"/>
    <Dialog.Content class="dialog">
      <Dialog.Title>Playback help</Dialog.Title>
      <Dialog.Description>Next move turns one face. Rewind returns to the start. The timeline moves to a completed step.</Dialog.Description>
      <Dialog.Close>Close help</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
