import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {faststart} from './faststart.mjs';
const manifest=JSON.parse(await readFile(new URL('../.migration/input.json',import.meta.url),'utf8'));
const folder=new URL('../.migration/optimized/',import.meta.url);await mkdir(folder,{recursive:true});
const prepared=[];
for(const file of manifest.files.filter(f=>f.content_type.startsWith('video/'))) {
 const input=await readFile(new URL('../.migration/'+file.local,import.meta.url));
 if(createHash('sha256').update(input).digest('hex')!==file.checksum)throw Error('Arquivo original divergente.');
 const result=faststart(input);if(!result.changed)continue;
 const name=file.id+'.mp4';await writeFile(new URL(name,folder),result.bytes);
 prepared.push({...file,key:'optimized/faststart-v1/'+name,checksum:createHash('sha256').update(result.bytes).digest('hex'),path:new URL(name,folder)});
 console.log('Preparado '+prepared.length+': '+result.chunks+' offsets conferidos, áudio e imagem preservados.');
}
if(process.argv.includes('--prepare-only')){console.log(prepared.length+' vídeos preparados localmente. Nenhum arquivo remoto alterado.');process.exit(0);}
const {Client}=await import('pg');const {S3Client,HeadObjectCommand,PutObjectCommand}=await import('@aws-sdk/client-s3');
const db=new Client({connectionString:process.env.DATABASE_URL_UNPOOLED,connectionTimeoutMillis:20000,query_timeout:60000});
const s3=new S3Client({forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',endpoint:process.env.AWS_ENDPOINT_URL_S3,region:process.env.AWS_REGION||'us-east-2',requestHandler:{connectionTimeout:15000,requestTimeout:120000},maxAttempts:2});
const bucket=process.env.NEON_STORAGE_BUCKET||'loteamento';
try {
 await db.connect();
 for(let i=0;i<prepared.length;i++) {
  const file=prepared[i];console.log('Enviando versão otimizada '+(i+1)+'/'+prepared.length+'...');
  const {rows}=await db.query('SELECT object_key,visibility,content_type FROM app_files WHERE id=$1 AND ready=true',[file.id]);
  if(!rows[0]||rows[0].visibility!=='public'||!rows[0].content_type.startsWith('video/')||![file.object_key,file.key].includes(rows[0].object_key))throw Error('Arquivo remoto alterado ou não autorizado.');
  let existing;try{existing=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:file.key}));}catch(e){if(e.$metadata?.httpStatusCode!==404)throw e;}
  if(existing&&existing.Metadata?.sha256!==file.checksum)throw Error('Versão remota otimizada divergente.');
  if(!existing)await s3.send(new PutObjectCommand({Bucket:bucket,Key:file.key,Body:await readFile(file.path),ContentType:'video/mp4',Metadata:{sha256:file.checksum},CacheControl:'private, max-age=300'}));
  const head=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:file.key}));
  if(Number(head.ContentLength)!==file.size_bytes||head.Metadata?.sha256!==file.checksum)throw Error('Verificação do upload falhou.');
 }
 await db.query('BEGIN');
 for(const file of prepared){const r=await db.query('UPDATE app_files SET object_key=$1 WHERE id=$2 AND object_key IN ($1,$3)',[file.key,file.id,file.object_key]);if(r.rowCount!==1)throw Error('Arquivo mudou durante a otimização.');}
 await db.query('COMMIT');console.log('Concluído: '+prepared.length+' vídeos otimizados. Os arquivos originais foram preservados.');
}catch(e){await db.query('ROLLBACK').catch(()=>{});console.error('Otimização interrompida:',e.message);process.exitCode=1;}finally{await db.end();s3.destroy();}
