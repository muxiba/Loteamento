import http from 'node:http';
import handler from './handler.mjs';
const server=http.createServer(async(req,res)=>{
 if(!req.url.startsWith('/api/')){res.writeHead(404);res.end();return;}
 try {let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1500000){res.writeHead(413);res.end('Payload muito grande');return;}chunks.push(chunk);}if(chunks.length)req.body=Buffer.concat(chunks).toString('utf8');await handler(req,res);}
 catch{if(!res.writableEnded){res.writeHead(500);res.end('Falha no servidor');}}
});
server.listen(3001,'127.0.0.1',()=>console.log('API local: http://127.0.0.1:3001/api/health'));
