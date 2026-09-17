import http from 'node:http';
import { main as goldenMain } from '../virtual-experts/golden-business-request.mjs';

const PORT = Number(process.env.PORT || 8787);
const GATEWAY_PORT = Number(process.env.COMMUNICATION_GATEWAY_PORT || (PORT + 1));

function respond(res,status,body,headers={}){
  res.writeHead(status,{ 'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers });
  res.end(JSON.stringify(body));
}

function proxy(req,res){
  const p=http.request({hostname:'127.0.0.1',port:GATEWAY_PORT,path:req.url,method:req.method,headers:req.headers},r=>{
    res.writeHead(r.statusCode||500,r.headers);
    r.pipe(res);
  });
  p.on('error',()=>respond(res,502,{error:'COMMUNICATION_GATEWAY_UNAVAILABLE'}));
  req.pipe(p);
}

async function route(req,res){
  if(req.method==='GET'&&req.url==='/api/v1/runtime/entry-health'){
    return respond(res,200,{service:'afagh-runtime-entry',status:'CONTROLLED',public_port:PORT,gateway_port:GATEWAY_PORT,build:process.env.SOURCE_BUILD||'UNKNOWN'});
  }
  if(req.url?.startsWith('/api/v1/golden/')) return goldenMain(req,res);
  return proxy(req,res);
}

http.createServer((req,res)=>route(req,res).catch(e=>{
  console.error(e);
  respond(res,500,{error:'RUNTIME_ENTRY_INTERNAL_ERROR'});
})).listen(PORT,'0.0.0.0',()=>console.log(`AFAGH Runtime Entry listening on :${PORT}; gateway :${GATEWAY_PORT}`));
