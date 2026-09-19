import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { cpus, platform, release } from 'node:os';
import { compilePlayback, solved } from '../../packages/cube-core/dist/index.js';

const origin = 'http://127.0.0.1:4175', base = '/the-cube/evaluation/';
const routes = { svelte:base, react:base+'react/react/index.html', cubing:base+'cubing/', components:base+'components/', production:'/the-cube/menu.html#/explore' };
const report = { recordedAt:new Date().toISOString(), environment:{platform:platform(),release:release(),cpu:cpus()[0]?.model,node:process.version}, method:'Cold fresh browser contexts; localhost, no network/CPU throttling; five Chromium samples. Estimated gzip per response body, not observed CDN transfer. Frame gaps are browser scheduling measurements, not physical-device FPS.', loads:{}, qualification:[], animation:[] };
const sequences = {2:['R','U',"R'","U'"],3:['R','U',"R'","U'",'M',"M'",'x',"x'"],4:['Rw','U',"Rw'","U'",'2R',"2R'",'x',"x'"],5:['3Rw','U',"3Rw'","U'",'M',"M'",'x',"x'"]};
await mkdir('results',{recursive:true});
const save=()=>writeFile('results/measurements.json',JSON.stringify(report,null,2)+'\n');
async function ready(page, name) {
  if(name==='components') await expect(page.getByRole('button',{name:'Playback help',exact:true})).toBeEnabled();
  else if(name==='production') await expect(page.getByTestId('playback-step')).toHaveText('0');
  else if(name==='cubing') {await expect(page.getByTestId('candidate-ready')).toHaveText('Ready',{timeout:30000});expect(await page.evaluate(async()=> (await document.querySelector('twisty-player').experimentalCurrentCanvases()).some(c=>c.width>0&&c.height>0))).toBe(true);}
  else {await expect(page.getByTestId('step')).toHaveText('0');await expect(page.locator('canvas')).toBeVisible();}
}
if(process.argv.includes('--qualify')) report.loads=JSON.parse(await readFile('results/measurements.json','utf8')).loads;
else {
const chrome=await chromium.launch();
report.environment.chromium=chrome.version();
for(let round=0;round<5;round++) for(const [name,path] of Object.entries(routes)) {
  const context=await chrome.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}});
  const page=await context.newPage(), bodies=[], errors=[];
  await page.addInitScript(name=>{
    function check() {
      const step=document.querySelector(`[data-testid="${name==='production'?'playback-step':'step'}"]`);
      const candidate=document.querySelector('[data-testid="candidate-ready"]');
      const canvas=document.querySelector('canvas');
      if(name==='components' ? document.querySelector('[data-dialog-trigger]:not(:disabled)') : name==='cubing' ? candidate?.textContent==='Ready' : step?.textContent==='0'&&canvas?.width>0&&canvas?.height>0) window.evaluationReady=performance.now();
      else requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  },name);
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',response=>{if(response.ok())bodies.push(response.body().then(body=>({url:response.url().replace(origin,''),bytes:body.length,gzip:gzipSync(body).length})).catch(()=>null));});
  await page.goto(origin+path);await ready(page,name);
  await page.waitForFunction(()=>window.evaluationReady>0);
  const readyMs=await page.evaluate(()=>window.evaluationReady);
  // Give lazy renderer imports a stable end condition; no service worker precache is counted.
  await page.waitForLoadState('networkidle');
  const assets=(await Promise.all(bodies)).filter(Boolean);
  const timing=await page.evaluate(()=>({domContentLoaded:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null}));
  (report.loads[name]??=[]).push({round,readyMs,...timing,bytes:assets.reduce((n,a)=>n+a.bytes,0),gzip:assets.reduce((n,a)=>n+a.gzip,0),requests:assets.length,assets,errors});
  if(errors.length)throw Error(`${name}: ${errors.join('; ')}`);
  await context.close();console.log(`load ${name} ${round+1}: ${Math.round(readyMs)}ms`);
}
await chrome.close();await save();
}
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
  if(process.env.EVALUATION_BROWSER && process.env.EVALUATION_BROWSER!==name)continue;
  console.log(`qualifying ${name}`);
  const browser=await engine.launch();
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}), page=await context.newPage();
  for(const framework of ['svelte','react']) {
    console.log(`${name}: ${framework}`);
    await page.goto(origin+routes[framework]);await ready(page,framework);
    for(const size of [2,3,4,5]) {
      await page.getByRole('combobox',{name:'Puzzle',exact:true}).selectOption(String(size));
      const states=compilePlayback(solved(size),sequences[size]).states;
      await page.getByRole('button',{name:'Next move',exact:true}).click();
      await expect(page.getByTestId('step')).toHaveText('1');
      await expect(page.getByTestId('facelets')).toHaveText(states[1].facelets);
      await page.getByRole('button',{name:'Previous',exact:true}).click();
      await expect(page.getByTestId('facelets')).toHaveText(states[0].facelets);
      await page.getByRole('slider',{name:'Move timeline'}).press('End');
      await expect(page.getByTestId('facelets')).toHaveText(states.at(-1).facelets);
      await page.getByRole('button',{name:'Rewind',exact:true}).click();
      await expect(page.getByTestId('step')).toHaveText('0');
      report.qualification.push({browser:name,framework,size,state:true,seek:true,reverse:true});
    }
    for(const width of [320,820,1440]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,40)}))))).toBe(true);
    }
    const axe=await new AxeBuilder({page}).analyze();
    expect(axe.violations,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)})))).toEqual([]);
    report.qualification.push({browser:name,framework,widths:[320,820,1440],axeViolations:axe.violations.length});
  }
  const candidateErrors=[];
  page.on('pageerror',error=>candidateErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')candidateErrors.push(message.text());});
  console.log(`${name}: cubing initialization`);
  try {
  await page.goto(origin+routes.cubing);await ready(page,'cubing');
  for(const size of [2,3,4,5]) {
    console.log(`${name}: cubing ${size}`);
    await page.getByRole('combobox',{name:'Puzzle',exact:true}).selectOption(String(size));
    await expect(page.getByTestId('candidate-ready')).toHaveText('Ready');
    const before=await page.getByTestId('pattern').textContent();
    await page.getByRole('button',{name:'Next move',exact:true}).click();
    await expect(page.getByTestId('pattern')).not.toHaveText(before);
    await page.getByRole('button',{name:'Previous',exact:true}).click();
    await expect(page.getByTestId('pattern')).toHaveText(before);
    expect(await page.evaluate(async()=> (await document.querySelector('twisty-player').experimentalCurrentCanvases()).some(c=>c.width>0&&c.height>0))).toBe(true);
    report.qualification.push({browser:name,framework:'cubing',size,reverse:true,canvas:true});
  }
  const cubingAxe=await new AxeBuilder({page}).analyze();
  report.qualification.push({browser:name,framework:'cubing',axeViolations:cubingAxe.violations.map(v=>({id:v.id,impact:v.impact}))});
  } catch(error) {
    report.qualification.push({browser:name,framework:'cubing',qualified:false,error:String(error).slice(0,1200),consoleErrors:[...new Set(candidateErrors)]});
    await page.screenshot({path:`results/${name}-cubing-failure.png`});
    console.log(`${name}: candidate not qualified`,[...new Set(candidateErrors)]);
  }
  await page.goto(origin+base+'components/');
  await ready(page,'components');
  await page.getByRole('button',{name:'Playback help',exact:true}).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>!!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.map(v=>v.id)).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Playback help',exact:true})).toBeFocused();
  report.qualification.push({browser:name,components:{focusTrap:true,escape:true,focusReturn:true,axeViolations:0}});
  await page.screenshot({path:`results/${name}-components.png`});
  // Enter the Svelte player through client navigation with no prior Three script.
  const navigationPage = await context.newPage();
  await navigationPage.goto(origin+base+'cubing/');
  await navigationPage.getByRole('link',{name:'Back to playback',exact:true}).click();
  await ready(navigationPage,'svelte');
  await expect(navigationPage.getByText('3D unavailable.',{exact:false})).toHaveCount(0);
  await navigationPage.getByRole('button',{name:'Next move',exact:true}).click();
  await expect(navigationPage.getByTestId('step')).toHaveText('1');
  report.qualification.push({browser:name,svelteClientNavigation:{canvas:true,step:true}});
  await navigationPage.close();
  await context.close();await browser.close();await save();console.log(`${name} qualification passed`);
}
// Full-motion samples, same controller and renderer on both frameworks.
const browser=await chromium.launch(), context=await browser.newContext({serviceWorkers:'block',reducedMotion:'no-preference'}), page=await context.newPage();
await page.addInitScript(()=>{
  window.frameSamples=[];let previous=0;
  function tick(now){if(previous)window.frameSamples.push(now-previous);previous=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
});
for(const framework of ['svelte','react']) for(const size of [2,3,4,5]) {
  await page.goto(origin+routes[framework]);await ready(page,framework);
  await page.getByRole('combobox',{name:'Puzzle',exact:true}).selectOption(String(size));
  await page.evaluate(()=>window.frameSamples=[]);
  const clicks=[];
  for(let i=0;i<5;i++) for(const button of ['Next move','Previous']) {
    const start=performance.now();await page.getByRole('button',{name:button,exact:true}).click();
    await expect(page.getByTestId('step')).toHaveText(button==='Next move'?'1':'0');clicks.push(performance.now()-start);
  }
  const samples=await page.evaluate(()=>window.frameSamples), sorted=[...samples].sort((a,b)=>a-b);
  report.animation.push({framework,size,turnDurationMs:320,clickToCommittedMs:clicks,frameSamples:samples.length,medianFrameGapMs:sorted[Math.floor(sorted.length/2)],p95FrameGapMs:sorted[Math.floor(sorted.length*.95)]});
  await page.screenshot({path:`results/${framework}-${size}.png`});
}
await context.close();await browser.close();await save();console.log('Measurements complete: results/measurements.json');
