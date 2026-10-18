# Integração Vercel e Neon — estado de 18/10/2026

## Produção publicada (13h36 BRT)

Publicação solicitada pelo usuário e concluída: deployment
`dpl_3sVpC8nXjTqL3RyGfAPuqBfdruWs`, commit
`9b925ff43f62d88c82d755befa2628b26b002bc5`, estado READY.
Endereço principal: https://loteamento.vercel.app
Seis variáveis Neon de servidor configuradas em production.
GET / e /cliente responderam 200 com o bundle atualizado;
GET /api/health respondeu 200 com {"ok":true}, confirmando acesso ao banco.
Login e upload autenticados ainda não validados de ponta a ponta.
O código publicado vem da branch codex/neon-migration; main ainda contém
a versão antiga e precisa ser integrada antes de futuros deploys por main.

## Preview publicado (13h09 BRT)

- Auditoria npm: zero vulnerabilidades no relatório atualizado.
- 16 testes locais e build Vite 8.3.4 passaram.
- Commit remoto: 9b925ff43f62d88c82d755befa2628b26b002bc5.
- Branch: codex/neon-migration; arquivo .env excluído da árvore publicada.
- Deployment: dpl_3L7X8WBsXYQUAcKbYJDUzgrCnTUP.
- URL: https://loteamento-cac9o9bac-muxibas-projects.vercel.app
- Build remoto concluído usando Node 22.
- GET /api/health respondeu 200 com ok true; banco conectado.
- GET /api/lots respondeu 200 com dados públicos; /cliente respondeu 200.
- Login, documentos e uploads ainda aguardam validação autenticada no navegador.
- Produção principal ainda não promovida e variáveis Neon restritas a previews desta branch.

## Migração confirmada (12h56 BRT)

Importação concluída e contagens confirmadas via conexão Neon: config 3,
gallery 37, lots 32, map_mapped 32, users 2, app_files prontos 67,
app_admins 1, app_migrations 1. Acesso inicial salvo em admin-access.txt.
Dependências instaladas pelo usuário e package-lock atualizado. Relatório
npm-audit-report.json contém 15 alertas com correção disponível; executar
npm audit fix sem --force, depois repetir build, testes e auditoria.
Contratos e recibos agora escapam as interpolações HTML na impressão.
Implantação e testes de login, isolamento e uploads no Vercel ainda pendentes.

## Atualização de acesso e configuração (11h55 BRT)

- GitHub e Vercel conectados; acesso ao projeto loteamento confirmado.
- Branch remota codex/neon-migration criada a partir de main; código novo ainda não enviado.
- Credencial de Storage criada para a branch migration-vercel.
- Sete variáveis de servidor salvas em .env.server.local, ignorado pelo Git.
- Seis variáveis configuradas no Vercel apenas para previews da branch codex/neon-migration.
- A conexão direta de migração permanece apenas local.
- Quatorze testes locais e build do frontend passaram novamente.
- npm install falhou com ENOTFOUND registry.npmjs.org no ambiente do agente.
  É necessário executar npm.cmd install no terminal do usuário antes da importação.
- Nenhum dado do backup foi importado; produção ainda usa sua configuração anterior.

As informações desta atualização prevalecem sobre o checkpoint anterior abaixo.

## Infraestrutura criada

- Projeto Neon: Loteamento (`purple-union-93810547`), PostgreSQL 17, Ohio.
- Branch de origem vazia: production (`br-flat-salad-b5py2uz3`).
- Branch de teste de migração: migration-vercel (`br-plain-breeze-b54f7kjw`).
- Esquema `db/001-neon.sql` aplicado somente na branch de migração.
- Bucket privado `loteamento` criado somente nessa branch.
- Nenhum registro de cliente ou arquivo foi enviado ainda.

## Preparação local

`scripts/prepare-migration.py` leu os backups de E:\Loteamento\backup e gerou
`.migration/input.json` e arquivos privados em `.migration/files`. Foram
preparados 32 lotes, 32 marcações, 37 mídias, 2 usuários e 3 configurações.
Há 67 arquivos: 63 do Storage e 4 anexos anteriormente embutidos no banco.
Senhas legadas foram convertidas para hashes scrypt. O diretório é ignorado
pelo Git e não deve ser publicado como conteúdo estático.

## Integração implementada, ainda sem validação em produção

API em `api/[...path].js`, módulos de servidor em `server/`, configuração de
rotas em `vercel.json`. Serviços React passaram a chamar a API de mesma origem.
Login por CPF e senha, administração no servidor, cookies HttpOnly,
autorização por lote e confirmação financeira restrita à administração.

Arquivos são enviados diretamente ao Storage com URL temporária e têm seus
metadados conferidos antes de serem anexados. O teste real de upload, inclusive
CORS, ainda precisa ser executado no domínio Vercel.

Compilação do frontend passou. Quatorze testes locais passaram: hash de senha,
cookie, origem, isolamento entre lotes, bloqueio de endpoints sem sessão e
proteção da chave PIX. Isso não valida login com banco, envio de arquivos ou
implantação real. A instalação das novas dependências de servidor falhou
porque elas não estavam no cache disponível; o package-lock ainda precisa
ser atualizado com uma instalação bem-sucedida antes de usar npm ci.

## Pendências para concluir

1. Confirmar instalação e conexão de Vercel e GitHub. Na última consulta desta
   sessão, ambos ainda apareciam como não instalados. O login local do gh
   também estava inválido.
2. Instalar dependências com npm install e atualizar package-lock.json.
3. Obter credenciais de banco e Storage para a branch de migração e gravar
   somente em `.env.server.local` (modelo em `.env.example`).
4. Executar `npm run migrate:neon`. O importador exige tabelas vazias, confere
   checksums, não executa SQL do backup e registra a importação para impedir
   sobreposição. Ele gera o acesso administrativo inicial em arquivo privado
   `admin-access.txt`, ignorado pelo Git.
5. Validar a migração, instalar a API no Vercel com variáveis de servidor e
   testar acesso de cliente, administração, propostas, comprovantes e galeria.
6. Atualizar configuração e documentação após os testes. Promover a branch
   validada ou implantar usando sua conexão, preservando o isolamento do
   ambiente até a decisão de publicação.

## Execução local com banco

Em dois terminais, depois de configurar as credenciais e instalar dependências:

```text
npm run dev:server
npm run dev
```

O Vite encaminha `/api` à porta 3001. `npm run dev:preview` continua sendo a
prévia visual com dados públicos do backup e acessos desabilitados; não deve
ser usado para testar login real.
