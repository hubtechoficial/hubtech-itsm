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
**Status:** 🟡 Em andamento
**Progresso:** 4/5 tarefas (80%)

#### Tarefas:
- [x] Webhook de recebimento de e-mail → validação de domínio contra Projeto (`src/app/api/webhooks/resend-inbound/route.ts`, `src/lib/chamados/ingest.ts`)
- [x] Criação de chamado a partir de e-mail novo — código escrito, com cálculo automático de SLA por Projeto
- [x] Encadeamento de resposta em chamado existente — via `In-Reply-To`/`References` contra `email_thread_id`
- [x] Resposta automática de rejeição para domínio não autorizado
- [ ] Configurar domínio de recebimento no Resend — **bloqueado**, aguardando definições de Rafael (ver pendências)

**🔴 Bloqueios atuais:**
1. Conta Resend: preciso de uma API Key para configurar o domínio de recebimento e enviar e-mails transacionais.
2. `hubtech.tec.br` pode já ter MX records de outro provedor de e-mail (ex: Google Workspace) para outros endereços (`admin@`, etc.). Apontar o MX do domínio raiz para o Resend quebraria esse serviço existente — a prática recomendada é usar um subdomínio dedicado só para recebimento (ex: `suporte@chamados.hubtech.tec.br`), o que mudaria o endereço combinado anteriormente (`suporte@hubtech.tec.br`).

### 🔵 FASE 03: ATENDIMENTO E SLA
**Status:** ⏳ Aguardando
**Progresso:** 0/5 tarefas (0%)

#### Tarefas:
- [ ] Categorização e priorização de chamado
- [ ] Roteamento automático para o time técnico
- [ ] Contador de SLA por Projeto (estados: dentro do prazo / atenção / crítico / a definir)
- [ ] Notificação por e-mail a cada atualização do chamado
- [ ] Alerta visual antes do estouro do SLA

### 🔵 FASE 04: PORTAL E PERFIS DE ACESSO
**Status:** ⏳ Aguardando
**Progresso:** 0/6 tarefas (0%)

#### Tarefas:
- [ ] Tela de login (usuário/senha) + "esqueci minha senha"
- [ ] Perfil Básico: lista + detalhe dos próprios chamados
- [ ] Perfil Supervisor: lista + detalhe dos chamados do Grupo/Setor + interação (comentar)
- [ ] Perfil Administrador: cadastro de Projetos
- [ ] Perfil Administrador: cadastro de Grupos e Usuários (com provisionamento de conta)
- [ ] Perfil Administrador: configuração de SLA e domínios por Projeto

### 🔵 FASE 05: BASE DE CONHECIMENTO
**Status:** ⏳ Aguardando
**Progresso:** 0/3 tarefas (0%)

#### Tarefas:
- [ ] Cadastro de artigos de solução (uso interno do time técnico)
- [ ] Busca de artigos
- [ ] Vínculo de artigo consultado ao chamado (rastreabilidade)

### 🔵 FASE 06: PRODUÇÃO (FINAL)
**Status:** ⏳ Aguardando
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] QA funcional completo (Ravena): os 3 perfis, isolamento entre Projetos, responsividade, fluxo de e-mail ponta a ponta
- [ ] Auditoria de segurança (Kerberos): RLS, validação de assinatura do webhook de e-mail, secrets, headers HTTP
- [ ] Merge `dev → hml` → `hml → main`
- [ ] Deploy em produção (Vercel)

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-07-08 | Shiva conduziu Descoberta completa e formalizou spec (projeto.md, moscow.md, design-system.json). Hades recebeu a spec e definiu stack + roadmap faseado. |
| 2026-07-08 | Atlas executou e concluiu a Fase 01: repositório GitHub, scaffold Next.js, Supabase (schema + RLS aplicados em produção), design tokens, autenticação, Vercel linkado com env vars, GitFlow (dev/hml/main) publicado. |
