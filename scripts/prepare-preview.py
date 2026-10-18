"""Gera uma pr�via local de leitura a partir dos backups do Loteamento.

Uso: py -3.13 scripts/prepare-preview.py "E:\\Loteamento\\backup"
Somente campos p�blicos s�o exportados. N�o exporta usu�rios, pagamentos ou PIX.
"""
import argparse
import gzip
import json
import re
import shutil
import urllib.parse
import zipfile
from pathlib import Path


def decode(value):
    if value == r'\N':
        return None
    chars = {'\\': '\\', 'b': '\b', 't': '\t', 'n': '\n', 'r': '\r', 'f': '\f', 'v': '\v'}
    return re.sub(r'\\([\\btnrfv])', lambda match: chars[match[1]], value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('backup_directory', type=Path)
    args = parser.parse_args()
    dumps = list(args.backup_directory.glob('*.backup.gz'))
    archives = list(args.backup_directory.glob('*.storage.zip'))
    if len(dumps) != 1 or len(archives) != 1:
        parser.error('A pasta precisa conter exatamente um .backup.gz e um .storage.zip.')
    with gzip.open(dumps[0], 'rt', encoding='utf-8') as stream:
        sql = stream.read()
    data = {}
    for match in re.finditer(r'^COPY ([\w.]+) \(([^\n]+)\) FROM stdin;\n(.*?)^\\\.$', sql, re.M | re.S):
        columns = [column.strip().strip('"') for column in match[2].split(',')]
        data[match[1]] = [dict(zip(columns, map(decode, line.split('\t')))) for line in match[3].splitlines()]
    required = ['public.lots', 'public.map_mapped', 'public.gallery', 'public.config', 'storage.objects']
    if any(table not in data for table in required):
        parser.error('O backup n�o possui todas as tabelas esperadas para o Loteamento.')
    root = Path(__file__).resolve().parents[1]
    output = root / '.preview-public' / 'preview'
    output.mkdir(parents=True, exist_ok=True)
    lots = [{key: row[key] for key in ['id', 'size', 'price', 'status', 'desc']} for row in data['public.lots']]
    for row in lots:
        row['price'] = float(row['price'] or 0)
    mapped = [{key: row[key] if key == 'id' else float(row[key]) for key in ['id', 'top', 'left', 'width', 'height']} for row in data['public.map_mapped']]
    config = {row['key']: json.loads(row['value']) for row in data['public.config'] if row['key'] == 'sim_config'}
    gallery = []
    with zipfile.ZipFile(archives[0]) as archive:
        names = set(archive.namelist())
        for row in data['public.gallery']:
            item = {key: row[key] for key in ['id', 'url', 'caption', 'type', 'name']}
            path = urllib.parse.urlsplit(item['url'] or '').path
            marker = '/storage/v1/object/public/'
            if marker in path:
                relative = urllib.parse.unquote(path.split(marker, 1)[1])
                matches = [name for name in names if name.endswith('/' + relative)]
                if len(matches) != 1:
                    raise ValueError('Arquivo de galeria ausente ou amb�guo no ZIP.')
                name = Path(relative).name
                target = output / 'media' / name
                target.parent.mkdir(exist_ok=True)
                target.write_bytes(archive.read(matches[0]))
                item['url'] = '/preview/media/' + urllib.parse.quote(name)
            gallery.append(item)
    snapshot = {'lots': lots, 'map': mapped, 'config': config, 'gallery': gallery}
    (output / 'data.json').write_text(json.dumps(snapshot, ensure_ascii=False), encoding='utf-8')
    shutil.copy2(root / 'public' / 'hero_river.png', root / '.preview-public' / 'hero_river.png')
    print(f'Pr�via pronta: {len(lots)} lotes, {len(mapped)} marca��es e {len(gallery)} itens de galeria.')


if __name__ == '__main__':
    main()
