import {randomUUID} from 'node:crypto';
import {query} from './db.mjs';
import {HttpError,assertAdmin,safeText} from './security.mjs';
let client;
async function storage() {
 if(!client){const {S3Client}=await import('@aws-sdk/client-s3');client=new S3Client({forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',endpoint:process.env.AWS_ENDPOINT_URL_S3,region:process.env.AWS_REGION || 'us-east-2'});}
 return client;
}
const types=new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf']);
export async function presignUpload(actor,body) {
 if(!actor || (actor.role==='client' && actor.user.status!=='approved'))throw new HttpError(401,'Entre na sua conta para enviar arquivos.');
 const purpose=body.purpose==='gallery'?'gallery':'document';
 if(purpose==='gallery')assertAdmin(actor);
 const name=safeText(body.name,240);
 const type=String(body.contentType);
 const size=Number(body.size);
 if(!types.has(type) || !Number.isSafeInteger(size) || size<=0 || size>100*1024*1024)throw new HttpError(400,'Formato ou tamanho de arquivo inválido (máximo 100 MB).');
 const id=randomUUID();const bucket=process.env.NEON_STORAGE_BUCKET || 'loteamento';
 const objectKey=purpose+'/'+id+'/'+name.replace(/[^a-zA-Z0-9._-]/g,'_');
 const lotId=actor.role==='client'?actor.user.lote_id:body.lotId || null;
 if(lotId && !(await query('SELECT 1 FROM lots WHERE id=$1',[lotId])).rows.length)throw new HttpError(400,'Lote inexistente.');
 await query('INSERT INTO app_files(id,bucket,object_key,content_type,size_bytes,visibility,owner_id,lot_id,purpose) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,bucket,objectKey,type,size,purpose==='gallery'?'public':'private',actor.user.id,lotId,purpose]);
 const {PutObjectCommand}=await import('@aws-sdk/client-s3');const {getSignedUrl}=await import('@aws-sdk/s3-request-presigner');
 const url=await getSignedUrl(await storage(),new PutObjectCommand({Bucket:bucket,Key:objectKey,ContentType:type}),{expiresIn:900});
 return {id,url};
}
export async function completeUpload(actor,id) {
 const {rows}=await query('SELECT * FROM app_files WHERE id=$1',[id]);const file=rows[0];
 if(!actor || !file || (actor.role!=='admin' && file.owner_id!==actor.user.id))throw new HttpError(403,'Arquivo não autorizado.');
 const {HeadObjectCommand}=await import('@aws-sdk/client-s3');const info=await (await storage()).send(new HeadObjectCommand({Bucket:file.bucket,Key:file.object_key}));
 if(Number(info.ContentLength)!==Number(file.size_bytes) || info.ContentType!==file.content_type)throw new HttpError(400,'O arquivo enviado não corresponde ao upload solicitado.');
 await query('UPDATE app_files SET ready=true WHERE id=$1',[id]);
 return {url:'/api/files/'+id,id};
}
export async function fileDownload(actor,id) {
 if(actor?.role==='client' && actor.user.status!=='approved')actor=null;
 const {rows}=await query('SELECT * FROM app_files WHERE id=$1 AND ready=true',[id]);const file=rows[0];
 if(!file)throw new HttpError(404,'Arquivo não encontrado.');
 if(file.visibility!=='public' && (!actor || (actor.role!=='admin' && file.owner_id!==actor.user.id && !(file.lot_id && file.lot_id===actor.user.lote_id && actor.user.status==='approved'))))throw new HttpError(403,'Arquivo privado.');
 const {GetObjectCommand}=await import('@aws-sdk/client-s3');const {getSignedUrl}=await import('@aws-sdk/s3-request-presigner');
 return getSignedUrl(await storage(),new GetObjectCommand({Bucket:file.bucket,Key:file.object_key,ResponseContentDisposition:file.content_type.startsWith('image/') || file.content_type.startsWith('video/')?'inline':'attachment'}),{expiresIn:300});
}
export async function assertOwnedFile(actor,url) {
 const match=/^\/api\/files\/([a-f0-9-]{36})$/.exec(String(url));
 if(!match)throw new HttpError(400,'Envie o arquivo antes de anexá-lo.');
 const {rows}=await query('SELECT id FROM app_files WHERE id=$1 AND ready=true AND owner_id=$2',[match[1],actor.user.id]);
 if(!rows.length)throw new HttpError(403,'Arquivo não autorizado.');
}
