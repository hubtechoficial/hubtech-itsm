# Hub Tech ITSM — Sistema de Registro de Chamados Técnicos

**Descrição:** Sistema de ITSM multi-tenant para os contratos de terceirização de suporte da Hub Tech. Chamados entram por e-mail institucional, ficam isolados por Projeto (contrato), com SLA configurável e portal de consulta com 3 perfis de acesso.
**Stack:** Next.js + Supabase (Postgres + Auth + RLS) + Vercel + Resend (e-mail transacional e recebimento) + GitHub (`hubtechoficial/hubtech-itsm`)
**Última atualização:** 2026-07-08

## Roadmap de Implementação

### 🔵 FASE 01: FUNDAÇÃO
**Status:** ✅ Concluída
**Progresso:** 8/8 tarefas (100%)

#### Tarefas:
- [x] Setup projeto Next.js (App Router) — Next.js 16.2.10, TypeScript, Tailwind v4
- [x] Configurar Supabase (projeto dedicado; migration `supabase/migrations/0001_init.sql` aplicada em produção)
- [x] Configurar Vercel (projeto `hubtech-itsm` linkado, GitHub integrado, env vars de produção/preview/development configuradas)
- [x] GitFlow (`dev`, `hml`, `main`) no repo `hubtechoficial/hubtech-itsm` — 3 branches criadas e empurradas
- [x] Aplicar design tokens (design-system.json / design-tokens.css) — cores, Space Grotesk + Inter aplicados em `globals.css` e `layout.tsx`
- [x] Autenticação via Supabase Auth (usuário/senha) + recuperação de senha — telas `/login`, `/esqueci-senha`, `/redefinir-senha` + `proxy.ts` protegendo rotas
- [x] RLS: isolamento total de dados por `projeto_id` — 6 tabelas com policies ativas, verificado em produção
- [x] Seed inicial: Projeto "Cúria" e Projeto "Seminário" — confirmado em produção com SLA da Cúria (120min/240min) e Seminário pendente

**⚠️ Pendência para a Fase 02:** os domínios de e-mail seedados (`arquidiocesebsb.org.br` para Cúria, `seminario.org.br` para Seminário) são placeholders — confirmar os domínios institucionais reais antes de ativar a ingestão por e-mail.

### 🔵 FASE 02: INGESTÃO DE CHAMADO POR E-MAIL
**Status:** ✅ Concluída (validação automática completa fica para a Fase 06)
**Progresso:** 5/5 tarefas (100%)

#### Tarefas:
- [x] Webhook de recebimento de e-mail → validação de domínio contra Projeto (`src/app/api/webhooks/resend-inbound/route.ts`, `src/lib/chamados/ingest.ts`)
- [x] Criação de chamado a partir de e-mail novo — código escrito, com cálculo automático de SLA por Projeto
- [x] Encadeamento de resposta em chamado existente — via `In-Reply-To`/`References` contra `email_thread_id`
- [x] Resposta automática de rejeição para domínio não autorizado
- [x] Configurar domínio de recebimento no Resend — `chamados.hubtech.tec.br` verificado, MX de recebimento ativo

**Decisão registrada:** `hubtech.tec.br` já usa Google Workspace para outras contas — confirmado por Rafael. Endereço de recebimento definido: **suporte@chamados.hubtech.tec.br** (subdomínio dedicado, não interfere no Google Workspace).

**Credenciais:** API Key e Webhook Signing Secret do Resend salvos no cofre e replicados em todos os ambientes do Vercel (Production, Development, Preview dev/hml) — 12/12 valores confirmados corretos após correção de um erro de automação (3 variáveis foram gravadas vazias na primeira tentativa; identificado e corrigido antes do deploy).

**Validação:** Rafael enviou um e-mail de teste real (`TI@arquidiocesedebrasilia.org.br` → `suporte@chamados.hubtech.tec.br`). O Resend recebeu corretamente, mas o webhook aponta para a URL de **produção** (`main`), que ainda não tem o código da Fase 02 — só chega lá após revisão de Ravena/Kerberos e aprovação de Rafael (GitFlow). Para confirmar que a lógica está correta sem furar esse processo, repliquei manualmente o e-mail recebido pelo mesmo código de ingestão: domínio reconhecido → Projeto "Cúria" → chamado e mensagem criados corretamente no banco. **Decisão de Rafael:** aceitar essa validação manual como suficiente por ora; o teste automático ponta a ponta (webhook real disparando em produção) fica para a Fase 06, após QA e segurança aprovarem o merge para `main`.

**🟡 Pendência:** registro MX de recebimento (`chamados`) já **verificado** ✅ — o domínio já pode receber e-mail. Registros de envio (DKIM, SPF) ainda em `pending`, aguardando propagação completa antes de confiar 100% nas notificações/respostas automáticas de saída.

### 🔵 FASE 03: ATENDIMENTO E SLA
**Status:** ✅ Concluída
**Progresso:** 5/5 tarefas (100%)

#### Tarefas:
- [x] Categorização e priorização de chamado — heurística por palavra-chave (`src/lib/chamados/priority.ts`); ajuste manual pela equipe fica pra tela de gestão (Fase 04)
- [x] Roteamento automático para o time técnico — e-mail de notificação interna para `suporte@hubtech.tec.br` (`INTERNAL_NOTIFICATION_EMAIL`) a cada chamado novo, até existir tela de gestão
- [x] Contador de SLA por Projeto — `src/lib/chamados/sla.ts` (`sem_sla` / `dentro_prazo` / `atencao` / `estourado` / `resolvido`), testado com casos de data
- [x] Notificação por e-mail a cada atualização — confirmação enviada ao solicitante na criação do chamado
- [x] Alerta visual antes do estouro do SLA — badge colorido (verde/amarelo/vermelho/neutro) na tela `/chamados`

### 🔵 FASE 04: PORTAL E PERFIS DE ACESSO
**Status:** ✅ Concluída
**Progresso:** 6/6 tarefas (100%)

#### Tarefas:
- [x] Tela de login (usuário/senha) + "esqueci minha senha" — já implementada na Fase 01
- [x] Perfil Básico: lista + detalhe dos próprios chamados (`/chamados`, `/chamados/[id]`)
- [x] Perfil Supervisor: lista + detalhe dos chamados do Grupo/Setor + interação (comentar) — RLS já restringe automaticamente por perfil
- [x] Perfil Administrador: cadastro de Projetos (`/admin/projetos`, com edição de domínios/SLA)
- [x] Perfil Administrador: cadastro de Grupos e Usuários (`/admin/grupos`, `/admin/usuarios` — provisionamento via `auth.admin.createUser`)
- [x] Perfil Administrador: configuração de SLA e domínios por Projeto — editável na própria tela de Projetos

**Primeira conta Administrador:** `rafael@hubtech.tec.br` provisionada diretamente no banco (bootstrap — não dava pra usar a tela, que exige um Admin já logado). Senha temporária entregue a Rafael fora deste documento; recomendado trocar via "esqueci minha senha" no primeiro acesso.

### 🔵 FASE 05: BASE DE CONHECIMENTO
**Status:** ✅ Concluída
**Progresso:** 3/3 tarefas (100%)

#### Tarefas:
- [x] Cadastro de artigos de solução (uso interno do time técnico) — `/admin/artigos`, restrito a perfil Administrador (RLS)
- [x] Busca de artigos — busca por título/conteúdo na mesma tela
- [x] Vínculo de artigo consultado ao chamado (rastreabilidade) — nova tabela `chamado_artigos_consultados` (migration `0003_kb_links.sql`, aplicada em produção), vínculo feito direto na tela de detalhe do chamado

### 🔵 FASE 06: PRODUÇÃO (FINAL)
**Status:** 🟡 Em andamento
**Progresso:** 1/4 tarefas (25%)

#### Tarefas:
- [x] QA funcional completo (Ravena) — aprovado, com navegador real (Playwright + Chromium). Testado: isolamento de dados entre Projetos e perfis (com usuários reais criados e descartados), rotas protegidas, rejeição do webhook sem assinatura, responsividade (mobile/tablet/desktop), acessibilidade básica, ausência de erros de console. Encontrado e corrigido 1 bug importante: tabelas cortavam colunas em mobile (375px) por causa de `overflow-hidden` sem scroll — agora com `overflow-x-auto`.
- [ ] Auditoria de segurança (Kerberos): RLS, validação de assinatura do webhook de e-mail, secrets, headers HTTP
- [ ] Merge `dev → hml` → `hml → main`
- [ ] Deploy em produção (Vercel)

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-07-08 | Shiva conduziu Descoberta completa e formalizou spec (projeto.md, moscow.md, design-system.json). Hades recebeu a spec e definiu stack + roadmap faseado. |
| 2026-07-08 | Atlas executou e concluiu a Fase 01: repositório GitHub, scaffold Next.js, Supabase (schema + RLS aplicados em produção), design tokens, autenticação, Vercel linkado com env vars, GitFlow (dev/hml/main) publicado. |
