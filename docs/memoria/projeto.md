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

## Modelo de Dados (conceitual)

```
Administrador (Hub Tech)
   └── acesso total: cadastra Projetos, Grupos e Usuários

Projeto (= contrato, ex: "Cúria", "Seminário")
   ├── isolado 100% dos demais Projetos — nenhum dado atravessa essa linha
   ├── domínio(s) de e-mail institucional autorizado(s)
   ├── SLA próprio (resposta / resolução)
   └── Grupos/Setores
          └── Usuários (perfil Básico ou Supervisor — cada um pertence a exatamente 1 Projeto)
                 ├── Básico → vê somente os próprios chamados
                 └── Supervisor → vê e interage nos chamados do seu Grupo/Setor
```

## Perfis de Acesso
- **Básico**: enxerga apenas os chamados que ele mesmo abriu.
- **Supervisor**: enxerga e interage (comenta, cobra andamento) nos chamados do seu Grupo/Setor, além dos próprios.
- **Administrador (Hub Tech)**: acesso total a todos os Projetos; responsável por cadastrar Projetos, Grupos e Usuários, e configurar SLA/domínios por Projeto.

Isolamento entre Projetos é uma regra estrutural: um usuário nunca enxerga dados de um Projeto diferente do seu, independentemente do perfil (exceto Administrador).

## Fluxo de Entrada de Chamados
Endereço de recebimento: **suporte@chamados.hubtech.tec.br** — subdomínio dedicado (não `hubtech.tec.br`, que já usa Google Workspace para outras contas; apontar o MX do domínio raiz para o Resend quebraria esse e-mail existente).

1. Cliente envia e-mail do domínio institucional autorizado do seu Projeto.
2. Sistema valida o domínio contra o Projeto correspondente; e-mail de domínio não autorizado (ex: Gmail pessoal) recebe resposta automática explicando que deve usar o e-mail institucional.
3. Novo chamado é criado (ou, se for resposta a um chamado existente, a mensagem é encadeada no mesmo chamado — sem duplicar).
4. Chamado é categorizado, priorizado e roteado automaticamente para o time técnico.
5. SLA do Projeto começa a contar; alertas visuais avisam antes do prazo estourar.
6. Notificações por e-mail a cada atualização relevante do chamado.

## Portal de Acompanhamento (v1)
- Login com usuário e senha — contas **provisionadas pelo Administrador** (não há autocadastro).
- Recuperação de senha ("esqueci minha senha") via e-mail.
- Escopo somente consulta na v1: status, histórico de mensagens e prazo de SLA dos chamados visíveis ao perfil do usuário logado.
- Abertura de chamado pelo portal fica fora da v1 (permanece só por e-mail); é candidata para versão futura.

## Volume Esperado
Baixo: cerca de 3 chamados por dia útil somando os contratos ativos (~60-65/mês). O sistema deve ser dimensionado para simplicidade, não para escala alta.

## Identidade Visual
Reaproveita o Brand Guideline oficial da Hub Tech (`HubTech_Brand_Guidelines_v2.pdf`), já aplicado no projeto do pitch-deck. Ver [design-system.json](design-system.json) e [design-tokens.css](design-tokens.css) — adaptados aqui para o contexto de aplicação (portal/painel), não apenas página institucional.

## Stack Técnica
Next.js + Supabase (Postgres + Auth + RLS) + Resend (e-mail transacional e recebimento) + Vercel. Definida pelo Hades na fase de roadmap.

## Repositório
`hubtechoficial/hubtech-itsm` no GitHub (privado). GitFlow: `dev` (desenvolvimento) → `hml` (homologação) → `main` (produção).
