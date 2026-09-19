import { chromium, firefox, webkit } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const results=[];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
  const browser=await engine.launch();
  try {
    const page=await browser.newPage();await page.goto('http://127.0.0.1:4175/the-cube/evaluation/');
    const capabilities=await page.evaluate(()=>({secureContext:isSecureContext,webBluetooth:'bluetooth' in navigator,webGL2:!!document.createElement('canvas').getContext('webgl2')}));
    results.push({browser:name,version:browser.version(),...capabilities,hardwarePaired:false});
  } finally {await browser.close();}
}
await writeFile('results/capabilities.json',JSON.stringify(results,null,2)+'\n');console.log(results);
