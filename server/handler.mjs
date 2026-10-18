import {query,transaction} from './db.mjs';
import {actorFor,login,logout,rateLimit} from './auth.mjs';
import {HttpError,checkOrigin,assertAdmin,assertClient,publicUser,hashPassword,normalizeCpf,safeText} from './security.mjs';
import {presignUpload,completeUpload,fileDownload,assertOwnedFile} from './storage.mjs';
const lotFields=new Set(['id','size','price','status','desc','client','client_cpf','payments','administrative_docs','paymentStatus','parcelasPagas','totalParcelas']);
const publicConfig=new Set(['sim_config','brokers_list','map_custom_url','about_text']);
const quote=value=>'"'+value+'"';
const idOf=value=>{if(!/^[a-f0-9-]{36}$/.test(String(value)))throw new HttpError(400,'Identificador inv�lido.');return value;};
function validateLot(body,create=false) {
 const result={};
 for(const [key,value] of Object.entries(body)) {if(lotFields.has(key) && value!==undefined)result[key]=value;}
 if(!create)delete result.id;
 if(create)result.id=safeText(String(body.id || ''),80);
 if(create && !result.id)throw new HttpError(400,'Informe o lote.');
 if(result.price!==undefined && (!Number.isFinite(Number(result.price)) || Number(result.price)<0))throw new HttpError(400,'Valor do lote inv�lido.');
 if(result.status!==undefined && !['Dispon�vel','Reservado','Vendido'].includes(result.status))throw new HttpError(400,'Status inv�lido.');
 for(const k of ['parcelasPagas','totalParcelas'])if(result[k]!==undefined && (!Number.isInteger(Number(result[k])) || Number(result[k])<0 || Number(result[k])>600))throw new HttpError(400,'Quantidade de parcelas inv�lida.');
 return result;
}
async function updateLot(id,changes,client={query}) {
 if(!Object.keys(changes).length)throw new HttpError(400,'Nenhuma altera��o informada.');
 const values=Object.values(changes).map((v,i)=>['payments','administrative_docs'].includes(Object.keys(changes)[i])?JSON.stringify(v):v);
 const setters=Object.keys(changes).map((key,i)=>quote(key)+'=$'+(i+1)).join(',');
 const {rows}=await client.query('UPDATE lots SET '+setters+',updated_at=now() WHERE id=$'+(values.length+1)+' RETURNING *',[...values,id]);
 if(!rows[0])throw new HttpError(404,'Lote n�o encontrado.');return rows[0];
}
async function register(req,body) {
 await rateLimit(req,'register',5);
 const cpf=normalizeCpf(body.cpf),name=safeText(body.name,150);
 if(cpf.length!==11 || !name)throw new HttpError(400,'Informe nome e CPF completos.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '')))throw new HttpError(400,'Informe um e-mail v�lido.');
 const password=await hashPassword(body.password);
 const lotId=safeText(String(body.lote_id || ''),80);
 return transaction(async client=>{
  const {rows}=await client.query('SELECT id,price,status FROM lots WHERE id=$1 FOR UPDATE',[lotId]);
  const lot=rows[0];if(!lot || lot.status!=='Dispon�vel')throw new HttpError(409,'O lote n�o est� dispon�vel para proposta.');
  const saved=await client.query("SELECT value FROM config WHERE key='sim_config'");
  const config=saved.rows[0]?.value;
  if(!config)throw new HttpError(503,'Condi��es de pagamento indispon�veis.');
  const months=Number(body.total_parcelas),entry=Number(body.simulation?.entrada),price=Number(lot.price);
  if(!Number.isInteger(months)||months<12||months>Number(config.maxParcelas)||!Number.isFinite(entry)||entry<Number(config.entradaMinima)||entry>=price)throw new HttpError(400,'Entrada ou prazo fora das condi��es de pagamento.');
  const rate=Number(config.taxaAnual),initial=(price-entry)/months,years=Math.ceil(months/12);
  let sum=0;for(let month=0;month<months;month++)sum+=initial*Math.pow(1+rate,Math.floor(month/12));
  const simulation={entrada:entry,saldo:price-entry,parcelaInicial:initial,parcelaFinalEstimada:initial*Math.pow(1+rate,Math.max(0,years-1)),totalPagoGeral:entry+sum,anos:years,taxa:rate,basePrice:price};
  const profile=body.profile && typeof body.profile==='object' && !Array.isArray(body.profile)?body.profile:{};
  const result=await client.query('INSERT INTO users(cpf,name,email,telefone,password,lote_id,simulation,total_parcelas,start_date,profile) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now(),$9) RETURNING id,status',[cpf,name,safeText(body.email,254),safeText(String(body.telefone || ''),40),password,lotId,simulation,months,profile]);
  return result.rows[0];
 });
}
async function route(req,res,path,body) {
 const method=req.method;
 if(method==='GET' && path[0]==='health') {await query('SELECT 1');return {ok:true};}
 if(method==='POST' && path.join('/')==='auth/login')return login(req,res,body);
 if(method==='POST' && path.join('/')==='auth/logout')return logout(req,res);
 if(method==='POST' && path.join('/')==='users/register')return register(req,body);
 const actor=await actorFor(req);
 if(method==='GET' && path[0]==='session')return actor || {user:null,role:null};
 if(path[0]==='files' && method==='GET') {const url=await fileDownload(actor,idOf(path[1]));res.statusCode=302;res.setHeader('Location',url);res.end();return;}
 if(path[0]==='uploads' && method==='POST') {
  if(path[1])return completeUpload(actor,idOf(path[1]));
  return presignUpload(actor,body);
 }
 if(path[0]==='account' && method==='GET') {
  if(!actor || actor.role!=='client' || actor.user.status!=='approved')throw new HttpError(401,'Entre no portal do cliente.');
  const {rows}=await query('SELECT * FROM lots WHERE id=$1',[actor.user.lote_id]);
  const pix=await query("SELECT value FROM config WHERE key='pix_key'");
  return {user:actor.user,lot:rows[0] || null,pixKey:pix.rows[0]?.value || null};
 }
 if(path[0]==='lots') {
  if(method==='GET') {
   if(actor?.role==='admin')return (await query(path[1]?'SELECT * FROM lots WHERE id=$1':'SELECT * FROM lots ORDER BY id',path[1]?[path[1]]:[])).rows;
   return (await query('SELECT id,size,price,status,"desc" FROM lots ORDER BY id')).rows;
  }
  const id=path[1];
  if(method==='POST' && path[2]==='proof') {
   assertClient(actor,id);const index=Number(body.index);
   if(!Number.isInteger(index)||index<0||index>600)throw new HttpError(400,'Parcela inv�lida.');
   await assertOwnedFile(actor,body.url);
   return transaction(async client=>{
    const {rows}=await client.query('SELECT * FROM lots WHERE id=$1 FOR UPDATE',[id]);const lot=rows[0];if(!lot)throw new HttpError(404,'Lote n�o encontrado.');
    const payments=[...(lot.payments || [])];if(index>=Number(lot.totalParcelas || 120))throw new HttpError(400,'Parcela inv�lida.');
    if(payments[index]?.quitado)throw new HttpError(409,'Esta parcela j� est� quitada.');
    while(payments.length<=index)payments.push({});
    payments[index]={...payments[index],comprovanteUrl:body.url,comprovanteName:safeText(String(body.name || 'Comprovante'),240)};
    return updateLot(id,{payments},client);
   });
  }
  if(method==='POST' && path[2]==='documents') {
   assertClient(actor,id);await assertOwnedFile(actor,body.url);
   return transaction(async client=>{
    const {rows}=await client.query('SELECT administrative_docs FROM lots WHERE id=$1 FOR UPDATE',[id]);if(!rows[0])throw new HttpError(404,'Lote n�o encontrado.');
    const docs=rows[0].administrative_docs || {};
    docs.clientDocs=[...(docs.clientDocs || []),{name:safeText(body.name,240),url:body.url}];
    return updateLot(id,{administrative_docs:docs},client);
   });
  }
  assertAdmin(actor);
  if(method==='POST' && !id) {
   const changes=validateLot(body,true),keys=Object.keys(changes);
   const result=await query('INSERT INTO lots('+keys.map(quote).join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING *',Object.values(changes).map((value,i)=>['payments','administrative_docs'].includes(keys[i])?JSON.stringify(value):value));
   return result.rows[0];
  }
  if(method==='PATCH' && id)return updateLot(id,validateLot(body));
  if(method==='DELETE' && id) {
   const linked=await query("SELECT 1 FROM users WHERE lote_id=$1 AND status='approved' LIMIT 1",[id]);if(linked.rows.length)throw new HttpError(409,'O lote possui cliente aprovado.');
   await transaction(async c=>{await c.query('DELETE FROM map_mapped WHERE id=$1',[id]);await c.query('DELETE FROM lots WHERE id=$1',[id]);});return {ok:true};
  }
 }
 if(path[0]==='config') {
  const key=path[1];if(!key)throw new HttpError(400,'Informe a configura��o.');
  if(method==='GET') {
   if(!publicConfig.has(key) && (!actor || (actor.role!=='admin' && key!=='pix_key')))throw new HttpError(403,'Configura��o restrita.');
   return (await query('SELECT value FROM config WHERE key=$1',[key])).rows[0]?.value ?? null;
  }
  assertAdmin(actor);
  if(method==='PUT') {safeText(key,100);await query('INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[key,JSON.stringify(body.value)]);return {key,value:body.value};}
 }
 if(path[0]==='map') {
  if(method==='GET')return (await query('SELECT * FROM map_mapped ORDER BY id')).rows;
  assertAdmin(actor);
  if(method==='PUT') {if(!Array.isArray(body.lots)||body.lots.length>1000)throw new HttpError(400,'Mapa inv�lido.');await transaction(async c=>{
   for(const rect of body.lots) {
    const values=['top','left','width','height'].map(k=>Number(rect[k]));
    if(values.some(x=>!Number.isFinite(x)||x<0||x>100))throw new HttpError(400,'Coordenadas inv�lidas.');
    await c.query('INSERT INTO map_mapped(id,top,"left",width,height) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET top=EXCLUDED.top,"left"=EXCLUDED."left",width=EXCLUDED.width,height=EXCLUDED.height',[safeText(String(rect.id),80),...values]);
   }
  });return {ok:true};}
  if(method==='DELETE') {await query(path[1]?'DELETE FROM map_mapped WHERE id=$1':'DELETE FROM map_mapped',path[1]?[path[1]]:[]);return {ok:true};}
 }
 if(path[0]==='gallery') {
  if(method==='GET')return (await query('SELECT * FROM gallery ORDER BY created_at DESC,id DESC')).rows;
  assertAdmin(actor);
  if(method==='POST') {
   if(!['image','localVideo','video','pdf'].includes(body.type))throw new HttpError(400,'Tipo de m�dia inv�lido.');
   if(!/^https:\/\//.test(String(body.url)) && !/^\/api\/files\/[a-f0-9-]{36}$/.test(String(body.url)))throw new HttpError(400,'URL inv�lida.');
   if(String(body.url).startsWith('/api/'))await assertOwnedFile(actor,body.url);
   return (await query('INSERT INTO gallery(url,caption,type,name) VALUES($1,$2,$3,$4) RETURNING *',[body.url,safeText(body.caption || '',1000),body.type,safeText(body.name || '',240)])).rows[0];
  }
  if(method==='DELETE' && /^\d+$/.test(path[1])) {await query('DELETE FROM gallery WHERE id=$1',[path[1]]);return {ok:true};}
 }
 if(path[0]==='users') {
  assertAdmin(actor);
  if(method==='GET')return (await query('SELECT * FROM users WHERE status=$1 ORDER BY created_at DESC',[new URL(req.url,'http://localhost').searchParams.get('status') || 'pending'])).rows.map(publicUser);
  if(method==='PATCH') {
   idOf(path[1]);if(!['pending','approved','rejected'].includes(body.status))throw new HttpError(400,'Status inv�lido.');
   return transaction(async c=>{
    const {rows}=await c.query('SELECT * FROM users WHERE id=$1 FOR UPDATE',[path[1]]);const user=rows[0];if(!user)throw new HttpError(404,'Cadastro n�o encontrado.');
    if(body.status==='approved') {
     await c.query('SELECT id FROM lots WHERE id=$1 FOR UPDATE',[user.lote_id]);
     const clash=await c.query("SELECT id FROM users WHERE lote_id=$1 AND status='approved' AND id<>$2",[user.lote_id,user.id]);
     if(clash.rows.length)throw new HttpError(409,'Este lote j� possui outro cliente aprovado.');
     await c.query('UPDATE lots SET status=$1,client=$2,client_cpf=$3,updated_at=now() WHERE id=$4',['Vendido',user.name,user.cpf,user.lote_id]);
    }
    const updated=await c.query("UPDATE users SET status=$1,approved_at=CASE WHEN $1='approved' THEN now() ELSE NULL END WHERE id=$2 RETURNING *",[body.status,user.id]);
    await c.query('DELETE FROM app_sessions WHERE user_id=$1',[user.id]);return publicUser(updated.rows[0]);
   });
  }
  if(method==='DELETE') {idOf(path[1]);await transaction(async c=>{await c.query('DELETE FROM app_sessions WHERE user_id=$1',[path[1]]);await c.query('DELETE FROM users WHERE id=$1',[path[1]]);});return {ok:true};}
 }
 throw new HttpError(404,'Recurso n�o encontrado.');
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try {
  const path=new URL(req.url,'http://localhost').pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);
  if(!['GET','POST','PUT','PATCH','DELETE'].includes(req.method))throw new HttpError(405,'M�todo n�o permitido.');
  let body={};
  if(req.method!=='GET') {
   checkOrigin(req);
   body=typeof req.body==='string'?JSON.parse(req.body):req.body || {};
   if(JSON.stringify(body).length>1500000)throw new HttpError(413,'Envie arquivos pelo upload, n�o dentro do cadastro.');
  }
  const result=await route(req,res,path,body);if(res.writableEnded)return;
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(result));
 } catch(error) {
  const code=error.status || (error.code==='23505'?409:error instanceof SyntaxError?400:503);
  const message=error.status?error.message:error.code==='23505'?'J� existe um cadastro com estes dados.':code===400?'JSON inv�lido.':'Servi�o temporariamente indispon�vel.';
  if(!error.status)console.error('API failure',error.code || error.name);
  res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:message}));
 }
}
