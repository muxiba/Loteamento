# Integra��o Vercel e Neon - estado de 18/10/2026

## Migra��o confirmada (12h56 BRT)

Importa��o conclu�da e contagens confirmadas via conex�o Neon: config 3,
gallery 37, lots 32, map_mapped 32, users 2, app_files prontos 67,
app_admins 1, app_migrations 1. Acesso inicial salvo em admin-access.txt.
Depend�ncias instaladas pelo usu�rio e package-lock atualizado. Relat�rio
npm-audit-report.json cont�m 15 alertas com corre��o dispon�vel; executar
npm audit fix sem --force, depois repetir build, testes e auditoria.
Contratos e recibos agora escapam as interpola��es HTML na impress�o.
Implanta��o e testes de login, isolamento e uploads no Vercel ainda pendentes.

## Atualiza��o de acesso e configura��o (11h55 BRT)

- GitHub e Vercel conectados; acesso ao projeto loteamento confirmado.
- Branch remota codex/neon-migration criada a partir de main; c�digo novo ainda n�o enviado.
- Credencial de Storage criada para a branch migration-vercel.
- Sete vari�veis de servidor salvas em .env.server.local, ignorado pelo Git.
- Seis vari�veis configuradas no Vercel apenas para previews da branch codex/neon-migration.
- A conex�o direta de migra��o permanece apenas local.
- Quatorze testes locais e build do frontend passaram novamente.
- npm install falhou com ENOTFOUND registry.npmjs.org no ambiente do agente.
  � necess�rio executar npm.cmd install no terminal do usu�rio antes da importa��o.
- Nenhum dado do backup foi importado; produ��o ainda usa sua configura��o anterior.

As informa��es desta atualiza��o prevalecem sobre o checkpoint anterior abaixo.

## Infraestrutura criada

- Projeto Neon: Loteamento (`purple-union-93810547`), PostgreSQL 17, Ohio.
- Branch de origem vazia: production (`br-flat-salad-b5py2uz3`).
- Branch de teste de migra��o: migration-vercel (`br-plain-breeze-b54f7kjw`).
- Esquema `db/001-neon.sql` aplicado somente na branch de migra��o.
- Bucket privado `loteamento` criado somente nessa branch.
- Nenhum registro de cliente ou arquivo foi enviado ainda.

## Prepara��o local

`scripts/prepare-migration.py` leu os backups de E:\Loteamento\backup e gerou
`.migration/input.json` e arquivos privados em `.migration/files`. Foram
preparados 32 lotes, 32 marca��es, 37 m�dias, 2 usu�rios e 3 configura��es.
H� 67 arquivos: 63 do Storage e 4 anexos anteriormente embutidos no banco.
Senhas legadas foram convertidas para hashes scrypt. O diret�rio � ignorado
pelo Git e n�o deve ser publicado como conte�do est�tico.

## Integra��o implementada, ainda sem valida��o em produ��o

API em `api/[...path].js`, m�dulos de servidor em `server/`, configura��o de
rotas em `vercel.json`. Servi�os React passaram a chamar a API de mesma origem.
Login por CPF e senha, administra��o no servidor, cookies HttpOnly,
autoriza��o por lote e confirma��o financeira restrita � administra��o.

Arquivos s�o enviados diretamente ao Storage com URL tempor�ria e t�m seus
metadados conferidos antes de serem anexados. O teste real de upload, inclusive
CORS, ainda precisa ser executado no dom�nio Vercel.

Compila��o do frontend passou. Quatorze testes locais passaram: hash de senha,
cookie, origem, isolamento entre lotes, bloqueio de endpoints sem sess�o e
prote��o da chave PIX. Isso n�o valida login com banco, envio de arquivos ou
implanta��o real. A instala��o das novas depend�ncias de servidor falhou
porque elas n�o estavam no cache dispon�vel; o package-lock ainda precisa
ser atualizado com uma instala��o bem-sucedida antes de usar npm ci.

## Pend�ncias para concluir

1. Confirmar instala��o e conex�o de Vercel e GitHub. Na �ltima consulta desta
   sess�o, ambos ainda apareciam como n�o instalados. O login local do gh
   tamb�m estava inv�lido.
2. Instalar depend�ncias com npm install e atualizar package-lock.json.
3. Obter credenciais de banco e Storage para a branch de migra��o e gravar
   somente em `.env.server.local` (modelo em `.env.example`).
4. Executar `npm run migrate:neon`. O importador exige tabelas vazias, confere
   checksums, n�o executa SQL do backup e registra a importa��o para impedir
   sobreposi��o. Ele gera o acesso administrativo inicial em arquivo privado
   `admin-access.txt`, ignorado pelo Git.
5. Validar a migra��o, instalar a API no Vercel com vari�veis de servidor e
   testar acesso de cliente, administra��o, propostas, comprovantes e galeria.
6. Atualizar configura��o e documenta��o ap�s os testes. Promover a branch
   validada ou implantar usando sua conex�o, preservando o isolamento do
   ambiente at� a decis�o de publica��o.

## Execu��o local com banco

Em dois terminais, depois de configurar as credenciais e instalar depend�ncias:

```text
npm run dev:server
npm run dev
```

O Vite encaminha `/api` � porta 3001. `npm run dev:preview` continua sendo a
pr�via visual com dados p�blicos do backup e acessos desabilitados; n�o deve
ser usado para testar login real.
