import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const read=async name=>JSON.parse(await readFile(`results/${name}.json`,'utf8'));
const report={...await read('measurements'),preservation:await read('preservation'),notation:await read('notation'),candidateRendering:await read('cubing-renderer'),capabilities:await read('capabilities')};
report.productionBaseline=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
execFileSync('git',['diff','--exit-code','--','../../apps','../../packages','../../src','../../assets','../../package.json','../../package-lock.json','../../service-worker.js','../../vite.config.js','../../scripts/build.mjs']);
report.productionInputsUnchanged=true;
const hash=createHash('sha256');let count=0;
async function digest(root,path='') {
  for(const e of (await readdir(root+path,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const relative=`${path}/${e.name}`;
    if(relative.includes('/evaluation'))throw Error('Prototype leaked into production export');
    if(e.isDirectory())await digest(root,relative);
    else {hash.update(relative);hash.update(await readFile(root+relative));count++;}
  }
}
await digest('../../export');report.productionExport={files:count,sha256:hash.digest('hex'),containsPrototype:false};
await writeFile('../../docs/architecture/p2b-measurements.json',JSON.stringify(report,null,2)+'\n');
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const names={svelte:'Matched SvelteKit + retained renderer',react:'Matched React + retained renderer',cubing:'SvelteKit + cubing.js (initial 3×3)',components:'SvelteKit + Bits/Tailwind/Lucide dialog',production:'Full production React explorer (context only)'};
const rows=Object.entries(report.loads).map(([key,r])=>`| ${names[key]} | ${(r[0].bytes/1024).toFixed(1)} | ${(r[0].gzip/1024).toFixed(1)} | ${Math.round(median(r.map(s=>s.readyMs)))} | ${r[0].requests} |`);
const table=['| Route | Raw KiB | Estimated gzip KiB | Median ready ms | Requests |','| --- | ---: | ---: | ---: | ---: |',...rows].join('\n');
const frameTable=['| Framework / size | Median frame gap ms | p95 frame gap ms |','| --- | ---: | ---: |',...report.animation.map(r=>`| ${r.framework} / ${r.size}×${r.size} | ${r.medianFrameGapMs.toFixed(1)} | ${r.p95FrameGapMs.toFixed(1)} |`)].join('\n');
const path='../../docs/architecture/24-stack-evaluation.md';
let doc=await readFile(path,'utf8');
doc=doc.replace(/<!-- MEASUREMENTS -->[\s\S]*?<!-- END MEASUREMENTS -->|<!-- MEASUREMENTS -->/,`<!-- MEASUREMENTS -->\n${table}\n\n${frameTable}\n<!-- END MEASUREMENTS -->`);
await writeFile(path,doc);console.log(table+'\n'+frameTable);
