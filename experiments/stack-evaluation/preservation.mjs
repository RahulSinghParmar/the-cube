import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const origin='http://127.0.0.1:4175', base='/the-cube/evaluation/';
const browser=await chromium.launch(), context=await browser.newContext({reducedMotion:'reduce'});
let page=await context.newPage();
const originalWorker=await readFile('build/service-worker.js','utf8');
const results={};
try {
  await page.goto(origin+base);
  await page.getByRole('button',{name:'Enable offline evaluation',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Offline evaluation ready'})).toBeVisible();
  await page.reload();
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.includes('/evaluation/'));
  await page.evaluate(()=>localStorage.setItem('evaluation-preservation-canary','unchanged'));
  await page.goto(origin+'/the-cube/timer.html');
  await page.getByRole('button',{name:'Start without holding',exact:true}).click();
  await page.getByRole('button',{name:'Stop timer',exact:true}).click();
  await expect(page.locator('#stat-count')).toHaveText('1');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/the-cube/service-worker.js'));
  await page.goto(origin+'/the-cube/menu.html#/learn');
  await page.getByRole('slider',{name:'Move timeline'}).press('End');
  await expect(page.getByTestId('playback-step')).toHaveText('2');
  const storageBefore=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
  for(const path of [base,base+'react/react/index.html',base+'cubing/',base+'components/']) {
    await page.goto(origin+path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
    expect(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()))).toBe(storageBefore);
  }
  await page.goto(origin+base);
  const oldCaches=await page.evaluate(()=>caches.keys());
  const oldEvalCache=oldCaches.find(k=>k.startsWith('cube-evaluation-'));
  // A generated local worker only. No repository or live worker is modified.
  await writeFile('build/service-worker.js',originalWorker.replace(oldEvalCache,oldEvalCache+'-upgrade'));
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration(location.href);await r.update();});
  await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration(location.href))?.waiting),{timeout:15000}).toBe(true);
  results.updateWaitsForOpenTab=true;
  expect(await page.evaluate(()=>caches.keys())).toContain(oldEvalCache);
  await page.close();page=await context.newPage();await page.goto(origin+base);
  await expect.poll(()=>page.evaluate(async old=>!(await caches.keys()).includes(old),oldEvalCache),{timeout:15000}).toBe(true);
  const newCaches=await page.evaluate(()=>caches.keys());
  for(const key of oldCaches.filter(k=>!k.startsWith('cube-evaluation-'))) expect(newCaches).toContain(key);
  results.productionCachePreserved=true;
  await context.setOffline(true);
  for(const path of [base,base+'cubing/',base+'components/']) {
    await page.goto(origin+path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
    if(path.endsWith('cubing/')) await expect(page.getByTestId('candidate-ready')).toHaveText('Ready');
  }
  await page.goto(origin+'/the-cube/timer.html');await expect(page.locator('#stat-count')).toHaveText('1');
  await page.goto(origin+'/the-cube/menu.html#/learn');await expect(page.getByTestId('playback-step')).toHaveText('2');
  results.offlineTimerAndLessonPreserved=true;
  for(const path of ['/the-cube/','/the-cube/?panel=settings','/the-cube/?panel=stats','/the-cube/legacy.html','/the-cube/menu.html#/explore']) {
    await page.goto(origin+path);
    if(path.includes('panel=settings'))await expect(page.getByRole('region',{name:'Cube settings'})).toBeVisible();
    else if(path.includes('panel=stats'))await expect(page.getByRole('region',{name:'Cube statistics'})).toBeVisible();
    else if(path.includes('explore'))await expect(page.getByTestId('playback-step')).toHaveText('0');
    else await expect(page.locator('canvas')).toBeVisible();
  }
  expect(await page.evaluate(()=>localStorage.getItem('evaluation-preservation-canary'))).toBe('unchanged');
  results.oldUrlsOffline=true;
  await writeFile('results/preservation.json',JSON.stringify(results,null,2)+'\n');console.log(results);
} finally {await writeFile('build/service-worker.js',originalWorker);await browser.close();}
