# Migração do Loteamento para Neon

## Estado em 18/10/2026

Inspeção do código local em E:\Loteamento. Cópia de trabalho isolada na branch
`codex/neon-migration`. Nenhuma alteração aplicada ao banco de produção.
O remoto configurado é https://github.com/muxiba/Loteamento.git.

## Dependências identificadas no código

| Recurso | Uso | Código principal |
| --- | --- | --- |
| lots | Lotes, clientes vinculados, parcelas e documentos | src/services/lotsService.js e src/pages/ClientArea.jsx |
| users | Propostas, cadastro, aprovação e login | src/services/userService.js e src/pages/ClientArea.jsx |
| config | PIX, simulador, corretores e imagem do mapa | src/services/configService.js |
| gallery | Metadados de imagens e vídeos | src/services/galleryService.js |
| map_mapped | Polígonos do mapa interativo | src/services/mapService.js |
| Storage gallery | Upload e URLs públicas de imagens e vídeos | src/services/galleryService.js |
| localStorage / IndexedDB | Conteúdo e referências locais de mapa e galeria | src/components e src/utils/db.js |

Esta lista descreve dependências do código, não um inventário confirmado do
banco. Colunas, tipos, índices, políticas, funções, relações e contagens precisam
ser extraídos do banco de origem antes de gerar a migração definitiva.

## Mudanças necessárias

- Criar API no servidor para consultar Neon, com credenciais apenas no servidor.
- Substituir os serviços Supabase e as consultas diretas em ClientArea.
- Implementar sessões e autorização no servidor para administrador e cliente.
- Substituir a credencial administrativa fixa no JavaScript e a comparação de
  senha de cliente diretamente na tabela. Não retornar senhas ao navegador.
- Definir armazenamento de arquivos e copiar objetos da galeria; atualizar as
  URLs e verificar também referências em configurações, parcelas e documentos.
- Separar os dados públicos dos lotes dos dados pessoais e financeiros.
- Revisar como os dados locais do navegador serão preservados ou centralizados.

## Sequência de execução

1. Obter acesso ao Supabase e Neon, identificar a hospedagem atual e recuperar
   a autenticação do GitHub antes de publicar alterações.
2. Exportar esquema, dados, regras e objetos de armazenamento com inventário.
3. Criar ambiente de homologação no Neon e importar preservando IDs e relações.
4. Implementar API, autenticação e armazenamento, usando o esquema confirmado.
5. Validar contagens, vínculos, parcelas, propostas, permissões e arquivos.
6. Testar compra/proposta, aprovação, login, consulta financeira, mapa, galeria
   e administração em homologação.
7. Pausar gravações durante a sincronização final e validar novamente antes
   de trocar a aplicação publicada. Manter plano de retorno e banco de origem.
8. Melhorar apresentação, navegação móvel, mapa, simulador e painéis sobre a
   base migrada. Não alterar condições financeiras sem validação específica.

## Bloqueios confirmados

- O painel Supabase redireciona para a página de login.
- Integração Neon localizada, mas ainda sem conexão confirmada.
- `gh auth status` informa autenticação inválida para a conta muxiba.
- E:\Loteamento pode ser lido, mas está fora dos diretórios autorizados para
  edição nesta sessão; alterações devem continuar nesta cópia de trabalho.

## Critérios de conclusão

Migração concluída somente após importação e conferência no destino, remoção
das dependências de execução do Supabase, testes dos fluxos reais e validação
da aplicação publicada. A inspeção inicial não representa migração concluída.
