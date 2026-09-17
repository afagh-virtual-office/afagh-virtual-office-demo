import http from 'node:http';

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

const server=http.createServer((req,res)=>{
  if(req.method==='GET'&&req.url==='/api/v1/runtime/entry-health'){
    return respond(res,200,{service:'afagh-runtime-entry',status:'CONTROLLED',public_port:PORT,gateway_port:GATEWAY_PORT,build:process.env.SOURCE_BUILD||'UNKNOWN'});
  }
  proxy(req,res);
});

server.listen(PORT,'0.0.0.0',()=>console.log(`AFAGH Runtime Entry listening on :${PORT}; gateway :${GATEWAY_PORT}`));
