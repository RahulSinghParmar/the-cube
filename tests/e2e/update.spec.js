import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

test('a new worker refreshes HTML even when the browser HTTP cache is still fresh', async ({page}) => {
  let release = 1;
  const root = resolve('export');
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
  const server = createServer(async (request,response) => {
    try {
      let pathname = new URL(request.url,'http://localhost').pathname.replace(/^\/the-cube/, '');
      if(pathname.endsWith('/')) pathname+='index.html';
      const file = resolve(root,`.${pathname}`);
      if(!file.startsWith(root+sep)) { response.writeHead(403).end(); return; }
      let body = await readFile(file);
      if(pathname.endsWith('.html')) body = Buffer.from(body.toString().replace('</head>',`<meta name="test-release" content="${release}"></head>`));
      if(pathname==='/service-worker.js') body = Buffer.from(body.toString().replace(/const CACHE = PREFIX \+ '[^']+';/,`const CACHE = PREFIX + 'upgrade-${release}';`));
      response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':pathname==='/service-worker.js'?'no-store':'public, max-age=3600'}).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/the-cube/`;
  try {
    await page.goto(base);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content','1');
    release = 2;
    await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
    await expect.poll(()=>page.evaluate(async base=>{
      const keys=await caches.keys();
      const key=keys.find(key=>key.endsWith('upgrade-2'));
      if(!key) return 'missing';
      const cache=await caches.open(key);
      const response=await cache.match(base+'index.html');
      return response ? (await response.text()).match(/name="test-release" content="(\d+)"/)?.[1] : 'empty';
    },base)).toBe('2');
    await page.goto('about:blank');
    await expect.poll(async()=>{
      await page.goto(base);
      const version=await page.locator('meta[name="test-release"]').getAttribute('content');
      if(version!=='2') await page.goto('about:blank');
      return version;
    }).toBe('2');
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});
