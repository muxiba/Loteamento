# Migra��o do Loteamento para Neon

## Estado em 18/10/2026

Inspe��o do c�digo local em E:\Loteamento. C�pia de trabalho isolada na branch
`codex/neon-migration`. Nenhuma altera��o aplicada ao banco de produ��o.
O remoto configurado � https://github.com/muxiba/Loteamento.git.

## Depend�ncias identificadas no c�digo

| Recurso | Uso | C�digo principal |
| --- | --- | --- |
| lots | Lotes, clientes vinculados, parcelas e documentos | src/services/lotsService.js e src/pages/ClientArea.jsx |
| users | Propostas, cadastro, aprova��o e login | src/services/userService.js e src/pages/ClientArea.jsx |
| config | PIX, simulador, corretores e imagem do mapa | src/services/configService.js |
| gallery | Metadados de imagens e v�deos | src/services/galleryService.js |
| map_mapped | Pol�gonos do mapa interativo | src/services/mapService.js |
| Storage gallery | Upload e URLs p�blicas de imagens e v�deos | src/services/galleryService.js |
| localStorage / IndexedDB | Conte�do e refer�ncias locais de mapa e galeria | src/components e src/utils/db.js |

Esta lista descreve depend�ncias do c�digo, n�o um invent�rio confirmado do
banco. Colunas, tipos, �ndices, pol�ticas, fun��es, rela��es e contagens precisam
ser extra�dos do banco de origem antes de gerar a migra��o definitiva.

## Mudan�as necess�rias

- Criar API no servidor para consultar Neon, com credenciais apenas no servidor.
- Substituir os servi�os Supabase e as consultas diretas em ClientArea.
- Implementar sess�es e autoriza��o no servidor para administrador e cliente.
- Substituir a credencial administrativa fixa no JavaScript e a compara��o de
  senha de cliente diretamente na tabela. N�o retornar senhas ao navegador.
- Definir armazenamento de arquivos e copiar objetos da galeria; atualizar as
  URLs e verificar tamb�m refer�ncias em configura��es, parcelas e documentos.
- Separar os dados p�blicos dos lotes dos dados pessoais e financeiros.
- Revisar como os dados locais do navegador ser�o preservados ou centralizados.

## Sequ�ncia de execu��o

1. Obter acesso ao Supabase e Neon, identificar a hospedagem atual e recuperar
   a autentica��o do GitHub antes de publicar altera��es.
2. Exportar esquema, dados, regras e objetos de armazenamento com invent�rio.
3. Criar ambiente de homologa��o no Neon e importar preservando IDs e rela��es.
4. Implementar API, autentica��o e armazenamento, usando o esquema confirmado.
5. Validar contagens, v�nculos, parcelas, propostas, permiss�es e arquivos.
6. Testar compra/proposta, aprova��o, login, consulta financeira, mapa, galeria
   e administra��o em homologa��o.
7. Pausar grava��es durante a sincroniza��o final e validar novamente antes
   de trocar a aplica��o publicada. Manter plano de retorno e banco de origem.
8. Melhorar apresenta��o, navega��o m�vel, mapa, simulador e pain�is sobre a
   base migrada. N�o alterar condi��es financeiras sem valida��o espec�fica.

## Bloqueios confirmados

- O painel Supabase redireciona para a p�gina de login.
- Integra��o Neon localizada, mas ainda sem conex�o confirmada.
- `gh auth status` informa autentica��o inv�lida para a conta muxiba.
- E:\Loteamento pode ser lido, mas est� fora dos diret�rios autorizados para
  edi��o nesta sess�o; altera��es devem continuar nesta c�pia de trabalho.

## Crit�rios de conclus�o

Migra��o conclu�da somente ap�s importa��o e confer�ncia no destino, remo��o
das depend�ncias de execu��o do Supabase, testes dos fluxos reais e valida��o
da aplica��o publicada. A inspe��o inicial n�o representa migra��o conclu�da.
