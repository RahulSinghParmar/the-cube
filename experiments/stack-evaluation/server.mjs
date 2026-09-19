import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const base = '/the-cube/evaluation';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{
  try {
    let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname), root;
    if(path.startsWith(base+'/react/')) {root=resolve('react-build');path=path.slice((base+'/react').length);}
    else if(path.startsWith(base+'/')) {root=resolve('build');path=path.slice(base.length);}
    else if(path.startsWith('/the-cube/')) {root=resolve('../../export');path=path.slice('/the-cube'.length);}
    else {res.writeHead(404).end();return;}
    const file=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404).end('Not found');}
}).listen(4175,'127.0.0.1',()=>console.log('Evaluation: http://127.0.0.1:4175/the-cube/evaluation/'));
