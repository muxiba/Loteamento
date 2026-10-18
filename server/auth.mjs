import {query} from './db.mjs';
import {HttpError,digest,getToken,normalizeCpf,verifyPassword,newToken,sessionCookie,publicUser} from './security.mjs';
let dummyHash;
export async function rateLimit(req, name, limit=10) {
 const ip=String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
 const key=digest(name+':'+ip);
 const {rows}=await query(`INSERT INTO app_rate_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN app_rate_limits.expires_at<now() THEN 1 ELSE app_rate_limits.count+1 END,expires_at=CASE WHEN app_rate_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE app_rate_limits.expires_at END RETURNING count`,[key]);
 if(rows[0].count>limit) throw new HttpError(429,'Muitas tentativas. Aguarde 15 minutos para tentar novamente.');
}
export async function actorFor(req) {
 const token=getToken(req); if(!/^[a-f0-9]{64}$/.test(token))return null;
 const {rows}=await query('SELECT user_id,role FROM app_sessions WHERE token_hash=$1 AND expires_at>now()',[digest(token)]);
 const session=rows[0];if(!session)return null;
 const result=await query(session.role==='admin'?'SELECT id,login FROM app_admins WHERE id=$1':'SELECT * FROM users WHERE id=$1',[session.user_id]);
 if(!result.rows[0])return null;
 return {role:session.role,user:publicUser(result.rows[0])};
}
export async function login(req,res,body) {
 const admin=body.type==='admin';
 const login=admin?String(body.login || '').trim().toLowerCase():normalizeCpf(body.login);
 await rateLimit(req,'login');
 await rateLimit(req,'login:'+digest(login),8);
 const {rows}=await query(admin?'SELECT * FROM app_admins WHERE lower(login)=$1':"SELECT * FROM users WHERE regexp_replace(cpf,'[^0-9]','','g')=$1",[login]);
 if(!dummyHash) {const {hashPassword}=await import('./security.mjs');dummyHash=await hashPassword('unavailable-account-dummy-password');}
 const row=rows[0];const valid=await verifyPassword(body.password,admin?row?.password_hash || dummyHash:row?.password || dummyHash);
 if(!row || !valid)throw new HttpError(401,'Login ou senha inv�lidos.');
 if(!admin && row.status!=='approved')throw new HttpError(403,'Cadastro aguardando aprova��o da administra��o.');
 const token=newToken();await query("INSERT INTO app_sessions(token_hash,user_id,role,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')",[digest(token),row.id,admin?'admin':'client']);
 res.setHeader('Set-Cookie',sessionCookie(token,Boolean(process.env.VERCEL)));
 return {role:admin?'admin':'client',user:publicUser(row)};
}
export async function logout(req,res) {
 await query('DELETE FROM app_sessions WHERE token_hash=$1',[digest(getToken(req))]);
 res.setHeader('Set-Cookie',sessionCookie('',Boolean(process.env.VERCEL),0));return {ok:true};
}
