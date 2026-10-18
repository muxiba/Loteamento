import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {hashPassword} from '../server/security.mjs';
import {migrationValues} from './migration-values.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {Client}=await import('pg');
const {S3Client,HeadObjectCommand,PutObjectCommand}=await import('@aws-sdk/client-s3');
if(!process.env.DATABASE_URL_UNPOOLED || !process.env.AWS_ENDPOINT_URL_S3 || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)throw new Error('Configure a conex�o direta e o Storage em .env.server.local.');
if(new URL(process.env.DATABASE_URL_UNPOOLED).hostname.includes('-pooler'))throw new Error('Use a conex�o direta para migrar.');
const db=new Client({connectionString:process.env.DATABASE_URL_UNPOOLED,connectionTimeoutMillis:20000,query_timeout:60000});
const s3=new S3Client({forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',requestHandler:{connectionTimeout:15000,requestTimeout:120000},maxAttempts:2,endpoint:process.env.AWS_ENDPOINT_URL_S3,region:process.env.AWS_REGION || 'us-east-2'});
const bucket=process.env.NEON_STORAGE_BUCKET || 'loteamento';
const manifest=JSON.parse(await readFile(resolve(root,'.migration/input.json'),'utf8'));
const allowed=new Set(['config','gallery','lots','map_mapped','users']);
try {
 console.log('1/4 Conectando ao banco Neon (limite de 20 segundos)...');
 await db.connect();
 console.log('2/4 Conferindo o esquema e o hist�rico de importa��o...');
 const schema=await readFile(resolve(root,'db/001-neon.sql'),'utf8');await db.query('BEGIN');await db.query(schema);await db.query('COMMIT');
 const previous=(await db.query('SELECT checksum FROM app_migrations WHERE id=$1',[manifest.id])).rows[0];
 if(previous) {if(previous.checksum!==manifest.checksum)throw new Error('Existe importa��o de outro backup. N�o ser� sobrescrita.');console.log('Este backup j� foi importado. Nenhum dado foi alterado.');}
 else {
  console.log('3/4 Enviando e conferindo '+manifest.files.length+' arquivos...');
  let completed=0;
  for(const file of manifest.files) {
   console.log('Arquivo '+(completed+1)+'/'+manifest.files.length+' ('+Math.ceil(file.size_bytes/1024)+' KB): conferindo...');
   const bytes=await readFile(resolve(root,'.migration',file.local));
   if(createHash('sha256').update(bytes).digest('hex')!==file.checksum)throw new Error('Integridade do arquivo inv�lida.');
   let existing;try{existing=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:file.object_key}));}catch(e){if(e.$metadata?.httpStatusCode!==404)throw e;}
   if(existing) {if(existing.Metadata?.sha256!==file.checksum)throw new Error('Objeto existente com conte�do diferente.');}
   else await s3.send(new PutObjectCommand({Bucket:bucket,Key:file.object_key,Body:bytes,ContentType:file.content_type,Metadata:{sha256:file.checksum}}));
   completed++;console.log('Arquivo '+completed+'/'+manifest.files.length+' conclu�do.');
  }
  console.log('4/4 Importando os registros no banco...');
  await db.query('BEGIN');
  for(const [table,rows] of Object.entries(manifest.tables)) {
   if(!allowed.has(table))throw new Error('Tabela n�o permitida.');
   const count=Number((await db.query('SELECT count(*) AS n FROM "'+table+'"')).rows[0].n);
   if(count)throw new Error('A tabela '+table+' j� cont�m dados. A importa��o exige destino vazio.');
   for(const row of rows) {
    const keys=Object.keys(row);if(keys.some(k=>!/^[a-zA-Z_]+$/.test(k)))throw new Error('Coluna inv�lida.');
    const values=migrationValues(table,row);
    await db.query('INSERT INTO "'+table+'"('+keys.map(k=>'"'+k+'"').join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',values);
   }
  }
  for(const file of manifest.files)await db.query('INSERT INTO app_files(id,bucket,object_key,content_type,size_bytes,visibility,owner_id,lot_id,purpose,ready) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true)',[file.id,bucket,file.object_key,file.content_type,file.size_bytes,file.visibility,file.owner_id,file.lot_id,file.purpose]);
  await db.query("SELECT setval(pg_get_serial_sequence('gallery','id'),GREATEST(COALESCE((SELECT max(id) FROM gallery),0),1),true)");
  await db.query('INSERT INTO app_migrations(id,checksum) VALUES($1,$2)',[manifest.id,manifest.checksum]);await db.query('COMMIT');
  for(const [table,rows] of Object.entries(manifest.tables)) {const count=Number((await db.query('SELECT count(*) AS n FROM "'+table+'"')).rows[0].n);if(count!==rows.length)throw new Error('Contagem divergente: '+table);console.log(table+': '+count+' registros conferidos');}
  console.log(manifest.files.length+' arquivos enviados e verificados.');
 }
 if(!(await db.query('SELECT id FROM app_admins LIMIT 1')).rows.length) {
  const login=process.env.BOOTSTRAP_ADMIN_LOGIN || 'marcel';const password=process.env.BOOTSTRAP_ADMIN_PASSWORD || randomBytes(18).toString('base64url');
  const hash=await hashPassword(password);
  await writeFile(resolve(root,'admin-access.txt'),'Acesso inicial da administra��o\nLogin: '+login+'\nSenha: '+password+'\nGuarde este arquivo em local privado. N�o envie para o GitHub.\n',{mode:0o600});
  await db.query('INSERT INTO app_admins(id,login,password_hash) VALUES($1,$2,$3)',[randomUUID(),login.toLowerCase(),hash]);console.log('Credenciais iniciais salvas em admin-access.txt (arquivo privado, ignorado pelo Git).');
 }
 console.log('Importa��o conclu�da. Valide o site antes de promover a branch.');
}catch(error){await db.query('ROLLBACK').catch(()=>{});console.error('Importa��o interrompida:',error.message);process.exitCode=1;}finally{await db.end();s3.destroy();}
