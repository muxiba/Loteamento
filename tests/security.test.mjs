import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,sessionCookie,getToken,checkOrigin,publicUser,assertClient} from '../server/security.mjs';
import handler from '../server/handler.mjs';

test('senhas recebem salt e hash e rejeitam tentativa incorreta',async()=>{
 const hash=await hashPassword('Senha-exemplo-2026');assert.notEqual(hash,'Senha-exemplo-2026');assert.ok(await verifyPassword('Senha-exemplo-2026',hash));assert.equal(await verifyPassword('outra-senha',hash),false);assert.equal(await verifyPassword('123','123'),false);assert.notEqual(hash,await hashPassword('Senha-exemplo-2026'));
});
test('resposta de usuário exclui os campos de senha',()=>{assert.deepEqual(publicUser({id:'1',password:'segredo',password_hash:'segredo'}),{id:'1'});});
test('cookie de sessão tem proteção e extração correta',()=>{assert.match(sessionCookie('abc',true),/HttpOnly; SameSite=Lax; Max-Age=28800; Secure/);assert.equal(getToken({headers:{cookie:'outro=1; rr_session=abc; teste=2'}}),'abc');});
test('requisições de outra origem são bloqueadas',()=>{assert.throws(()=>checkOrigin({headers:{host:'site.example',origin:'https://outro.example','content-type':'application/json'}}),/Origem/);assert.throws(()=>checkOrigin({headers:{host:'site.example','sec-fetch-site':'cross-site','content-type':'application/json'}}),/Origem/);});
test('cliente não acessa outro lote nem enquanto pendente',()=>{assert.throws(()=>assertClient({role:'client',user:{status:'approved',lote_id:'101'}},'102'));assert.throws(()=>assertClient({role:'client',user:{status:'pending',lote_id:'101'}},'101'));assert.doesNotThrow(()=>assertClient({role:'client',user:{status:'approved',lote_id:'101'}},'101'));});
async function request(method,path,body={}) {const req={method,url:'/api/'+path,body,headers:{host:'site.example',origin:'https://site.example','content-type':'application/json'}};const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(text){this.writableEnded=true;this.body=JSON.parse(text);}};await handler(req,res);return res;}
for(const [method,path] of [['GET','account'],['GET','users'],['POST','lots'],['PATCH','lots/101'],['PATCH','lots/101/payments/0'],['POST','lots/101/proof'],['POST','lots/101/documents'],['POST','uploads'],['PUT','map']])test(method+' '+path+' recusa acesso sem sessão',async()=>{assert.equal((await request(method,path)).statusCode,401);});
test('PIX não é exposto em requisição anônima',async()=>{assert.equal((await request('GET','config/pix_key')).statusCode,403);});
