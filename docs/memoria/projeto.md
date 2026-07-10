# Projeto: Hub Tech ITSM — Sistema de Registro de Chamados Técnicos

## Visão Geral
Sistema de ITSM (registro e acompanhamento de chamados técnicos) para os contratos de terceirização de suporte da Hub Tech. Substitui o atendimento informal (e-mail solto, sem prazo, sem histórico centralizado) por um fluxo estruturado com SLA, isolamento por contrato e portal de acompanhamento.

## Para Quem
- **Clientes finais** (contratantes do suporte terceirizado): pessoas das instituições atendidas, que abrem chamado por e-mail e acompanham pelo portal.
- **Time técnico da Hub Tech**: recebe, categoriza e resolve os chamados.
- **Administrador (Hub Tech)**: cadastra e gerencia Projetos (contratos), Grupos e Usuários.

## Problema Resolvido
Hoje o suporte técnico dos contratos de terceirização não tem um sistema formal de chamados — sem prazo de resposta garantido (SLA), sem histórico organizado por cliente, sem separação clara entre os diferentes contratos atendidos. O sistema resolve isso com abertura de chamado por e-mail, contagem automática de SLA por contrato e um portal de consulta.

## Contratos Ativos (na v1)
| Projeto | Instituição | SLA Resposta | SLA Resolução |
|---|---|---|---|
| Cúria | Cúria Metropolitana de Brasília | 2h | 4h |
| Seminário | Seminário Maior Arquidiocesano de Brasília | a definir | a definir |

Novos contratos (Projetos) podem ser adicionados no futuro pelo Administrador — o modelo já nasce preparado para isso.

## Modelo de Dados (conceitual) — atualizado (v1.1)

```
Administrador (Hub Tech)
   └── acesso total: cadastra Projetos, Grupos, Usuários e atribui Projetos aos Técnicos

Projeto (= contrato, ex: "Cúria", "Seminário")
   ├── isolado 100% dos demais Projetos — nenhum dado atravessa essa linha
   ├── domínio(s) de e-mail institucional autorizado(s)
   ├── SLA próprio (resposta / resolução)
   └── Grupos/Setores
          └── Usuários Básico/Supervisor (cada um pertence a exatamente 1 Projeto)
                 ├── Básico → vê e cria os próprios chamados (portal ou e-mail)
                 └── Supervisor → vê e interage nos chamados do seu Grupo/Setor

Técnico (Hub Tech)
   └── vinculado a 1 ou mais Projetos (definido pelo Administrador)
          └── dentro de cada Projeto vinculado, vê e atende TODOS os chamados (todos os Grupos)
```

## Perfis de Acesso
- **Básico**: enxerga e cria (portal ou e-mail) apenas os próprios chamados.
- **Supervisor**: enxerga e interage (comenta, cobra andamento) nos chamados do seu Grupo/Setor, além dos próprios.
- **Técnico** (novo, v1.1): funcionário da Hub Tech vinculado a um ou mais Projetos pelo Administrador. Dentro de cada Projeto vinculado, vê e atende todos os chamados (sem restrição de Grupo/Setor — diferente do Supervisor). Um chamado novo entra numa fila compartilhada entre os Técnicos daquele Projeto; qualquer um deles "pega" o chamado (atribuição manual, não automática).
- **Administrador (Hub Tech)**: acesso total a todos os Projetos; responsável por cadastrar Projetos, Grupos, Usuários, e vincular Técnicos aos Projetos que atendem. Também pode criar/atender chamados de qualquer Projeto.

Isolamento entre Projetos é uma regra estrutural pra Básico e Supervisor: nunca enxergam dados de um Projeto diferente do seu. Técnico é a exceção controlada — só vê os Projetos que o Administrador explicitamente vinculou a ele.

## Fluxo de Entrada de Chamados
Endereço de recebimento: **suporte@chamados.hubtech.tec.br** — subdomínio dedicado (não `hubtech.tec.br`, que já usa Google Workspace para outras contas; apontar o MX do domínio raiz para o Resend quebraria esse e-mail existente).

1. Cliente envia e-mail do domínio institucional autorizado do seu Projeto.
2. Sistema valida o domínio contra o Projeto correspondente; e-mail de domínio não autorizado (ex: Gmail pessoal) recebe resposta automática explicando que deve usar o e-mail institucional.
3. Novo chamado é criado (ou, se for resposta a um chamado existente, a mensagem é encadeada no mesmo chamado — sem duplicar).
4. Chamado é categorizado, priorizado e roteado automaticamente para o time técnico.
5. SLA do Projeto começa a contar; alertas visuais avisam antes do prazo estourar.
6. Notificações por e-mail a cada atualização relevante do chamado.

## Portal de Acompanhamento (v1.1)
- Login com usuário e senha — contas **provisionadas pelo Administrador** (não há autocadastro).
- Recuperação de senha ("esqueci minha senha") via e-mail.
- Consulta: status, histórico de mensagens e prazo de SLA dos chamados visíveis ao perfil do usuário logado.
- **Abertura de chamado pelo portal (v1.1 — revisto):** todos os perfis podem abrir chamado direto pelo portal, além do e-mail (que continua existindo como canal "fácil" pro cliente que prefere simplesmente mandar um e-mail).
- **Tipo de item** (Incidente, Solicitação de Serviço, Dúvida — a definir a lista exata com o Hades/Atlas) escolhido na abertura do chamado, exibido com ícone/badge na listagem.
- **Código curto sequencial por Projeto** (ex: `CUR-1`, `SEM-1`) como referência legível do chamado, em vez do UUID interno.
- **Fila do Técnico:** ordenada por prioridade (desc) e depois data de criação (mais antigo primeiro); com filtros rápidos "Meus chamados", "Não atribuídos", "Todos do Projeto"; coluna "Responsável" mostrando quem já pegou cada chamado.
- **Anexos (upload de arquivo):** importante pro Rafael (print de erro ajuda o Técnico), mas viabilidade técnica (armazenamento, tamanho, origem e-mail vs portal) ainda em avaliação pelo Hades antes de entrar no escopo formal.
- **Menu de perfil** (canto superior direito): acesso a configurações da conta, incluindo foto de perfil.
- **Seletor de Projeto** (topo, visível para Técnicos vinculados a mais de 1 Projeto): escolhe um Projeto de cada vez; a tela mostra somente os dados daquele Projeto selecionado.
- **Painéis (dashboards)** por perfil — versão enxuta na v1.1 (cartões coloridos por status/SLA + contagens simples; sem gráfico de tendência ainda, fica pra quando o volume justificar):
  - Básico: status dos chamados que abriu
  - Supervisor: status dos chamados do seu Grupo/Setor
  - Técnico: fila de chamados do Projeto selecionado
  - Administrador: visão geral de todos os Projetos

## Volume Esperado
Baixo: cerca de 3 chamados por dia útil somando os contratos ativos (~60-65/mês). O sistema deve ser dimensionado para simplicidade, não para escala alta.

## Identidade Visual
Reaproveita o Brand Guideline oficial da Hub Tech (`HubTech_Brand_Guidelines_v2.pdf`), já aplicado no projeto do pitch-deck. Ver [design-system.json](design-system.json) e [design-tokens.css](design-tokens.css) — adaptados aqui para o contexto de aplicação (portal/painel), não apenas página institucional.

## Stack Técnica
Next.js + Supabase (Postgres + Auth + RLS) + Resend (e-mail transacional e recebimento) + Vercel. Definida pelo Hades na fase de roadmap.

## Repositório
`hubtechoficial/hubtech-itsm` no GitHub (privado). GitFlow: `dev` (desenvolvimento) → `hml` (homologação) → `main` (produção).
