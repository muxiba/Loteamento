# Reserva do Rio - primeira etapa de melhorias

## Implementado

- Nova p�gina inicial com a identidade verde do empreendimento e navega��o m�vel.
- Busca por n�mero do lote, filtro de disponibilidade, ordena��o por pre�o e lista de compara��o.
- Planta interativa com sele��o por teclado, legenda, painel de detalhes e amplia��o.
- Propostas pelo mapa somente para lotes dispon�veis.
- Galeria sem imagens ou v�deos fict�cios, com carregamento gradual, amplia��o e reprodu��o de arquivos locais.
- Mensagens de carregamento, indisponibilidade e recupera��o de falhas.
- Consulta p�blica de lotes sem campos de cliente e uso dessa consulta no simulador.
- P�ginas internas carregadas sob demanda para reduzir o carregamento inicial.
- Pr�via local isolada das grava��es, sem usu�rios, senhas, CPFs, PIX ou pagamentos.

## Abrir a pr�via

Nesta c�pia do reposit�rio, execute:

```powershell
py -3.13 scripts/prepare-preview.py "E:\Loteamento\backup"
npm run dev:preview
```

Abra o endere�o Local informado pelo Vite. Os arquivos da pr�via ficam em
`.preview-public`, ignorado pelo Git e separado do diret�rio p�blico usado no
build de produ��o. Para recriar a pr�via, use somente os backups autorizados.

## Valida��o e limites

Compila��o de produ��o e verifica��o do diff executadas. O build de produ��o
n�o cont�m a pasta de dados da pr�via. A valida��o visual e as intera��es reais
no navegador ainda precisam ser conclu�das: a sess�o de navegador automatizado
falhou e a verifica��o HTTP local foi bloqueada pelas permiss�es de rede.

As condi��es e o modelo de c�lculo financeiro foram preservados. A revis�o
completa dos c�lculos e contratos ainda n�o integra esta etapa.

## Pr�ximas etapas

A migra��o ainda n�o foi executada. Importar os backups em projeto pr�prio no
Neon, configurar armazenamento, criar API com autoriza��o e substituir o login
legado. A autentica��o administrativa fixa e a senha de cliente em tabela ainda
precisam ser substitu�das antes da publica��o da aplica��o completa. As �reas
restritas e o envio de propostas ficam desabilitados no modo de pr�via.

N�o houve publica��o, altera��o nos bancos ou modifica��o da pasta original
E:\Loteamento. O trabalho est� na c�pia isolada, branch codex/neon-migration.
