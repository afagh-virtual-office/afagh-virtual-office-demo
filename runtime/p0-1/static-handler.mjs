import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

export async function serveStatic(req,res){
  if(req.method !== 'GET' && req.method !== 'HEAD') return false;
  const u=new URL(req.url,'http://localhost');
  let requested=decodeURIComponent(u.pathname);
  if(requested === '/') requested='/index.html';
  if(requested.endsWith('/')) requested += 'index.html';
  const candidate=path.resolve(ROOT, `.${requested}`);
  if(!candidate.startsWith(ROOT + path.sep)) return false;
  try{
    const stat=await fs.stat(candidate);
    if(!stat.isFile()) return false;
    const body=await fs.readFile(candidate);
    res.writeHead(200,{'content-type':TYPES[path.extname(candidate)]||'application/octet-stream','cache-control':'no-store'});
    if(req.method !== 'HEAD') res.end(body); else res.end();
    return true;
  }catch{return false;}
}
