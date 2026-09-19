import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(root, {withFileTypes:true})) {
    const path = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(`${root}/${entry.name}`, path));
    else result.push(path);
  }
  return result;
}
const all = [...(await files('build')).map(p=>({file:`build${p}`,url:p})), ...(await files('react-build')).map(p=>({file:`react-build${p}`,url:`/react${p}`}))];
const hash = createHash('sha256');
for(const item of all) hash.update(await readFile(item.file));
const version = hash.digest('hex').slice(0,12), base = '/the-cube/evaluation';
const urls = all.map(item=>base + item.url);
urls.push(base+'/',base+'/cubing/',base+'/components/');
await writeFile('build/service-worker.js', `// Local evaluation only. Scope never covers the production application.
const cacheName='cube-evaluation-${version}';
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(${JSON.stringify(urls)}))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cube-evaluation-')&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).pathname.startsWith('${base}/'))e.respondWith(caches.open(cacheName).then(async c=>(await c.match(e.request))||fetch(e.request)));});
`);
console.log(`Isolated offline build ${version}: ${urls.length} assets/routes`);
