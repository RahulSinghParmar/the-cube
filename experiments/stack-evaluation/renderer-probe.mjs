import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const browser=await chromium.launch(), results=[];
try {
  for(const size of [2,3,4,5]) {
    const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'no-preference'}), page=await context.newPage(), requests=[];
    page.on('response',r=>{if(r.ok())requests.push(r.body().then(body=>({url:new URL(r.url()).pathname,bytes:body.length,gzip:gzipSync(body).length})).catch(()=>null));});
    await page.addInitScript(()=>{window.frameSamples=[];let previous=0;function tick(now){if(previous)window.frameSamples.push(now-previous);previous=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);});
    await page.goto('http://127.0.0.1:4175/the-cube/evaluation/cubing/');
    await expect(page.getByTestId('candidate-ready')).toHaveText('Ready');
    await page.getByRole('combobox',{name:'Puzzle',exact:true}).selectOption(String(size));
    await expect(page.getByTestId('candidate-ready')).toHaveText('Ready');
    await page.waitForLoadState('networkidle');
    const before = await page.evaluate(async()=>{const p=document.querySelector('twisty-player');return {alg:(await p.experimentalModel.alg.get()).alg.toString(),timeline:await p.experimentalModel.detailedTimelineInfo.get(),duration:(await p.experimentalModel.indexer.get()).algDuration(),tempo:await p.experimentalModel.tempoScale.get()};});
    await page.evaluate(()=>window.frameSamples=[]);
    const start=performance.now();await page.getByRole('button',{name:'Play',exact:true}).click();
    await expect.poll(()=>page.evaluate(async()=> (await document.querySelector('twisty-player').experimentalModel.detailedTimelineInfo.get()).atEnd),{timeout:12000,intervals:[50]}).toBe(true);
    const elapsed=performance.now()-start, samples=await page.evaluate(()=>window.frameSamples), sorted=[...samples].sort((a,b)=>a-b);
    const after=await page.evaluate(async()=>document.querySelector('twisty-player').experimentalModel.detailedTimelineInfo.get());
    expect(after.atEnd).toBe(true);
    await page.screenshot({path:`results/cubing-animation-${size}.png`});
    const assets=(await Promise.all(requests)).filter(Boolean);
    results.push({size,sequence:"R U R' U'",before,after,autoplayCompleted:true,autoplayTimingQualified:elapsed>=before.duration/before.tempo*.8,elapsedMs:elapsed,medianFrameGapMs:sorted[Math.floor(sorted.length/2)],p95FrameGapMs:sorted[Math.floor(sorted.length*.95)],frameSamples:samples.length,bytes:assets.reduce((n,a)=>n+a.bytes,0),gzip:assets.reduce((n,a)=>n+a.gzip,0),assets});
    await context.close();
  }
} finally {await browser.close();}
await writeFile('results/cubing-renderer.json',JSON.stringify(results,null,2)+'\n');console.log(results.map(({assets,...r})=>r));
