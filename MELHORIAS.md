# Reserva do Rio — primeira etapa de melhorias

## Implementado

- Nova página inicial com a identidade verde do empreendimento e navegação móvel.
- Busca por número do lote, filtro de disponibilidade, ordenação por preço e lista de comparação.
- Planta interativa com seleção por teclado, legenda, painel de detalhes e ampliação.
- Propostas pelo mapa somente para lotes disponíveis.
- Galeria sem imagens ou vídeos fictícios, com carregamento gradual, ampliação e reprodução de arquivos locais.
- Mensagens de carregamento, indisponibilidade e recuperação de falhas.
- Consulta pública de lotes sem campos de cliente e uso dessa consulta no simulador.
- Páginas internas carregadas sob demanda para reduzir o carregamento inicial.
- Prévia local isolada das gravações, sem usuários, senhas, CPFs, PIX ou pagamentos.

## Abrir a prévia

Nesta cópia do repositório, execute:

```powershell
py -3.13 scripts/prepare-preview.py "E:\Loteamento\backup"
npm run dev:preview
```

Abra o endereço Local informado pelo Vite. Os arquivos da prévia ficam em
`.preview-public`, ignorado pelo Git e separado do diretório público usado no
build de produção. Para recriar a prévia, use somente os backups autorizados.

## Validação e limites

Compilação de produção e verificação do diff executadas. O build de produção
não contém a pasta de dados da prévia. A validação visual e as interações reais
no navegador ainda precisam ser concluídas: a sessão de navegador automatizado
falhou e a verificação HTTP local foi bloqueada pelas permissões de rede.

As condições e o modelo de cálculo financeiro foram preservados. A revisão
completa dos cálculos e contratos ainda não integra esta etapa.

## Próximas etapas

A migração ainda não foi executada. Importar os backups em projeto próprio no
Neon, configurar armazenamento, criar API com autorização e substituir o login
legado. A autenticação administrativa fixa e a senha de cliente em tabela ainda
precisam ser substituídas antes da publicação da aplicação completa. As áreas
restritas e o envio de propostas ficam desabilitados no modo de prévia.

Não houve publicação, alteração nos bancos ou modificação da pasta original
E:\Loteamento. O trabalho está na cópia isolada, branch codex/neon-migration.
