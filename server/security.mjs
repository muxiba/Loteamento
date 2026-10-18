import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const digest = value => createHash('sha256').update(value).digest('hex');
export const normalizeCpf = value => String(value || '').replace(/\D/g, '');
export async function hashPassword(password) {
 if (typeof password !== 'string' || password.length < 8 || password.length > 256) throw new HttpError(400,'A senha precisa ter entre 8 e 256 caracteres.');
 const salt = randomBytes(16).toString('hex');
 const key = await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return 'scrypt$32768$' + salt + '$' + key.toString('hex');
}
export async function verifyPassword(password, stored) {
 if (typeof password !== 'string' || password.length > 256 || typeof stored !== 'string') return false;
 const parts=stored.split('$');
 if (parts.length!==4 || parts[0]!=='scrypt' || parts[1]!=='32768' || !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{128}$/.test(parts[3])) return false;
 const key=await scrypt(password,parts[2],64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return timingSafeEqual(key,Buffer.from(parts[3],'hex'));
}
export function sessionCookie(token, secure, maxAge=28800) { return 'rr_session='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAge+(secure?'; Secure':''); }
export function getToken(req) { return (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('rr_session='))?.slice(11) || ''; }
export function checkOrigin(req) {
 const origin=req.headers.origin;
 if (req.headers['sec-fetch-site']==='cross-site') throw new HttpError(403,'Origem não autorizada.');
 if (origin) {
  let url; try {url=new URL(origin);} catch {throw new HttpError(403,'Origem inválida.');}
  if (url.host!==req.headers.host || !['http:','https:'].includes(url.protocol)) throw new HttpError(403,'Origem não autorizada.');
 }
 if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415,'Envie JSON.');
}
export function publicUser(row) { if (!row) return null; const {password,password_hash,...safe}=row; return safe; }
export const newToken = () => randomBytes(32).toString('hex');
export function assertAdmin(actor) { if (actor?.role!=='admin') throw new HttpError(actor?403:401,'Acesso restrito à administração.'); }
export function assertClient(actor, lotId) { if (!actor || (actor.role!=='admin' && (actor.user.status!=='approved' || actor.user.lote_id!==lotId))) throw new HttpError(actor?403:401,'Acesso não autorizado a este lote.'); }
export function safeText(value, max=500) { if (typeof value!=='string' || value.length>max || /[<>\u0000]/.test(value)) throw new HttpError(400,'Texto inválido.'); return value.trim(); }
