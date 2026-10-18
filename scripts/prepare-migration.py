"""Prepara dados e arquivos do backup, sem executar SQL do dump.

Uso: py -3.13 scripts/prepare-migration.py "E:\\Loteamento\\backup"
O resultado privado fica em .migration, ignorado pelo Git.
"""
import argparse,base64,gzip,hashlib,json,mimetypes,re,secrets,uuid,zipfile
from pathlib import Path
from urllib.parse import urlsplit,unquote

def decode(value):
    if value==r'\N': return None
    escaped={'b':'\b','t':'\t','n':'\n','r':'\r','f':'\f','v':'\v','\\':'\\'}
    return re.sub(r'\\([0-7]{1,3}|x[0-9a-fA-F]{1,2}|.)',lambda m:chr(int(m[1],8)) if m[1][0] in '01234567' else chr(int(m[1][1:],16)) if m[1].startswith('x') else escaped.get(m[1],m[1]),value)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('backup_directory',type=Path);args=parser.parse_args()
    dumps=list(args.backup_directory.glob('*.backup.gz'));archives=list(args.backup_directory.glob('*.storage.zip'))
    if len(dumps)!=1 or len(archives)!=1:parser.error('Informe pasta com um backup do banco e um ZIP do Storage.')
    output=Path(__file__).resolve().parents[1]/'.migration';(output/'files').mkdir(parents=True,exist_ok=True)
    with gzip.open(dumps[0],'rt',encoding='utf-8') as f:sql=f.read()
    data={}
    for m in re.finditer(r'^COPY ([\w.]+) \(([^\n]+)\) FROM stdin;\n(.*?)^\\\.$',sql,re.M|re.S):
        cols=[x.strip().strip('"') for x in m[2].split(',')]
        data[m[1]]=[dict(zip(cols,map(decode,line.split('\t')))) for line in m[3].splitlines()]
    tables={key.removeprefix('public.'):data[key] for key in ['public.config','public.gallery','public.lots','public.map_mapped','public.users']}
    for table,columns in {'config':['value'],'lots':['payments','administrative_docs'],'users':['simulation','profile']}.items():
        for row in tables[table]:
            for key in columns:row[key]=json.loads(row[key]) if row.get(key) is not None else None
    files=[];old_urls={};namespace=uuid.UUID('f42a3c4c-e4ce-4e02-a926-dc161c36bb72')
    def add_file(raw,mime,context,visibility='private',lot_id=None,owner=None):
        checksum=hashlib.sha256(raw).hexdigest();fid=str(uuid.uuid5(namespace,context+':'+checksum));local='files/'+fid
        if not any(f['id']==fid for f in files):
            (output/local).write_bytes(raw)
            files.append({'id':fid,'object_key':'import/'+fid,'content_type':mime,'size_bytes':len(raw),'visibility':visibility,'owner_id':owner,'lot_id':lot_id,'purpose':'gallery' if visibility=='public' else 'document','checksum':checksum,'local':local})
        return '/api/files/'+fid
    public_paths=set()
    for item in tables['gallery']:
        path=unquote(urlsplit(item['url'] or '').path);marker='/storage/v1/object/public/'
        if marker in path:public_paths.add(path.split(marker,1)[1])
    with zipfile.ZipFile(archives[0]) as archive:
        bad=archive.testzip()
        if bad:raise ValueError('ZIP com arquivo corrompido.')
        for info in archive.infolist():
            if info.is_dir():continue
            relative=info.filename.split('/',1)[1]
            mime=mimetypes.guess_type(relative)[0] or 'application/octet-stream'
            old_urls[relative]=add_file(archive.read(info),mime,'storage:'+relative,'public' if relative in public_paths else 'private')
    def transform(value,context,visibility='private',lot_id=None,owner=None):
        if isinstance(value,dict):return {key:transform(val,context+'/'+key,visibility,lot_id,owner) for key,val in value.items()}
        if isinstance(value,list):return [transform(val,context+'/'+str(i),visibility,lot_id,owner) for i,val in enumerate(value)]
        if not isinstance(value,str):return value
        match=re.fullmatch(r'data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)',value)
        if match:return add_file(base64.b64decode(match[2],validate=False),match[1],context,visibility,lot_id,owner)
        marker='/storage/v1/object/public/'
        if value.startswith(('https://','http://')) and marker in urlsplit(value).path:
            relative=unquote(urlsplit(value).path.split(marker,1)[1])
            if relative not in old_urls:raise ValueError('Refer�ncia a arquivo ausente do backup.')
            return old_urls[relative]
        return value
    for lot in tables['lots']:
        for key in ['payments','administrative_docs']:lot[key]=transform(lot[key],'lot:'+lot['id']+'/'+key,lot_id=lot['id'])
    for item in tables['gallery']:item['url']=transform(item['url'],'gallery:'+item['id'],'public')
    for item in tables['config']:item['value']=transform(item['value'],'config:'+item['key'],'private' if item['key']=='pix_key' else 'public')
    for user in tables['users']:
        user['cpf']=re.sub(r'\D','',user['cpf'])
        password=user['password']
        if not password.startswith('scrypt$32768$'):
            salt=secrets.token_hex(16);hashed=hashlib.scrypt(password.encode(),salt=salt.encode(),n=32768,r=8,p=1,maxmem=64*1024*1024,dklen=64)
            user['password']='scrypt$32768$'+salt+'$'+hashed.hex()
        for key in ['simulation','profile']:user[key]=transform(user[key],'user:'+user['id']+'/'+key,owner=user['id'],lot_id=user['lote_id'])
    checksum=hashlib.sha256(dumps[0].read_bytes()+archives[0].read_bytes()).hexdigest()
    payload={'id':'supabase-original-import','checksum':checksum,'tables':tables,'files':files}
    (output/'input.json').write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
    print('Migra��o preparada (ainda n�o importada):',json.dumps({k:len(v) for k,v in tables.items()}),'arquivos:',len(files))
    print('Senhas convertidas em hashes; anexos separados dos registros. Nenhum dado foi publicado.')

if __name__=='__main__':main()
