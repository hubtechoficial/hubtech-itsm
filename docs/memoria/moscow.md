# Priorização MoSCoW — Hub Tech ITSM (V1)

## MUST HAVE
1. Abertura de chamado por e-mail, com validação de domínio institucional por Projeto (contrato)
2. Resposta automática de rejeição para e-mail de domínio não autorizado
3. Encadeamento de respostas no mesmo chamado (sem duplicar chamado por resposta de e-mail)
4. Categorização e priorização do chamado
5. SLA configurável por Projeto (resposta / resolução), com alerta visual antes de estourar o prazo — exibe "SLA a definir" quando o Projeto ainda não tiver prazos configurados
6. Roteamento automático do chamado para o time técnico da Hub Tech
7. Base de conhecimento para consulta do time técnico
8. Notificações por e-mail a cada atualização relevante do chamado
9. Portal com login por usuário e senha (contas provisionadas pelo Administrador)
10. Recuperação de senha ("esqueci minha senha")
11. Isolamento total de dados por Projeto (multi-tenant) — nenhum usuário enxerga dados de um Projeto que não seja o seu
12. Três perfis de acesso: Básico (próprios chamados), Supervisor (próprios + do seu Grupo/Setor, com poder de interagir), Administrador (acesso total)
13. Cadastro de Projetos, Grupos/Setores e Usuários pelo Administrador

## SHOULD HAVE
- Catálogo de solicitações padronizadas (separar "incidente" de "pedido de serviço", ex: reset de senha)
- Filtro e busca no portal (por status, por data)

## COULD HAVE
- Abertura de chamado diretamente pelo portal (hoje só por e-mail)
- Pesquisa de satisfação (CSAT) ao fechar o chamado

## WON'T HAVE (por agora)
- Gestão de Problemas, Gestão de Mudanças e Gestão de Ativos (CMDB)
- Canais adicionais de abertura (WhatsApp, Teams etc.)
- Autocadastro de usuários no portal (contas são sempre provisionadas pelo Administrador na v1)

---

# Priorização MoSCoW — Expansão V1.1 (pós-lançamento)

Levantado em 2026-07-10, após a V1 entrar em produção. Ver `projeto.md` para o modelo de dados atualizado.

## MUST HAVE
1. Novo perfil **Técnico**: vinculado a 1 ou mais Projetos pelo Administrador; dentro de cada Projeto vinculado, vê e atende todos os chamados (sem restrição de Grupo/Setor)
2. Fila compartilhada de chamados por Projeto — chamado novo não é atribuído a ninguém; qualquer Técnico daquele Projeto pode "pegar" o chamado (atribuição manual)
3. Abertura de chamado direto pelo portal, para todos os perfis (Básico, Supervisor, Técnico, Administrador) — e-mail continua funcionando em paralelo
4. Menu de perfil (canto superior direito) com acesso a configurações da conta e foto de perfil
5. Seletor de Projeto no topo da navegação, para Técnicos vinculados a mais de 1 Projeto
6. Painéis (dashboards) por perfil — versão enxuta: cartões coloridos por status/SLA + contagens simples (Básico: próprios chamados · Supervisor: chamados do Grupo · Técnico: fila do Projeto selecionado · Administrador: visão geral)
7. Cadastro de vínculo Técnico ↔ Projeto pelo Administrador (tela de gestão)
8. **Ordenação padrão da fila do Técnico:** prioridade (decrescente) e depois data de criação (mais antigo primeiro) — garante que chamado urgente e chamado esquecido não fiquem escondidos
9. **Filtros rápidos pré-definidos** na fila do Técnico: "Meus chamados" (atribuídos a mim), "Não atribuídos" (disponíveis pra pegar), "Todos do Projeto selecionado"
10. **Coluna "Responsável"** na listagem — mostra qual Técnico já pegou cada chamado (ou "não atribuído")
11. **Código curto sequencial por Projeto** (ex: `CUR-1`, `SEM-1`) — substitui/complementa o UUID interno como referência legível do chamado
12. **Tipo de item do chamado** (ex: Incidente, Solicitação de Serviço, Dúvida) — campo definido na abertura, exibido com ícone/badge na listagem (retoma o que estava como "catálogo de solicitações padronizadas" da V1 original)

## SHOULD HAVE
- Ação de "devolver à fila" (Técnico desiste do chamado que pegou, volta a ficar disponível pra outro)

## COULD HAVE
- Gráfico de tendência nos painéis (criados x resolvidos ao longo do tempo) — fica pra quando o volume de chamados crescer o suficiente pra esse gráfico contar uma história
- Reatribuição de chamado entre Técnicos pelo Administrador

## EM AVALIAÇÃO TÉCNICA (Hades)
- **Anexos (upload de arquivo) no chamado** — Rafael confirmou que é importante (print de erro ajuda o Técnico), mas quer entender a viabilidade técnica antes de comprometer o escopo. Hades precisa avaliar: armazenamento (Supabase Storage), limite de tamanho, como recebe anexo vindo por e-mail (Resend já entrega anexos no payload) vs upload direto pelo portal, e custo. Decisão de escopo (Must/Should/Could) fica pendente do retorno técnico.

## WON'T HAVE (por agora)
- Atribuição automática de chamado (por carga de trabalho, round-robin, etc.) — v1.1 é sempre "fila compartilhada, Técnico escolhe"
- Painel com múltiplos gadgets/gráficos no estilo Jira completo — versão enxuta primeiro, evolui com o volume
- Busca avançada por query (JQL) — poder de mercado desproporcional ao nosso volume
- Conceito de "Epic" (agrupamento de itens) — não se aplica a chamado de suporte
- Exportar/compartilhar lista de chamados
