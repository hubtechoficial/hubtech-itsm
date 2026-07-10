# Hub Tech ITSM — Sistema de Registro de Chamados Técnicos

**Descrição:** Sistema de ITSM multi-tenant para os contratos de terceirização de suporte da Hub Tech. Chamados entram por e-mail institucional ou portal, ficam isolados por Projeto (contrato), com SLA configurável, fila de atendimento por Técnico e portal com 4 perfis de acesso.
**Stack:** Next.js + Supabase (Postgres + Auth + RLS + Storage) + Vercel + Resend (e-mail transacional e recebimento) + GitHub (`hubtechoficial/hubtech-itsm`)
**Última atualização:** 2026-07-10
**Status geral:** 🎉 V1 em produção · 🟡 V1.1 em planejamento (perfil Técnico, portal de abertura, painéis, anexos)

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
**Status:** ✅ Concluída
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] QA funcional completo (Ravena) — aprovado, com navegador real (Playwright + Chromium). Testado: isolamento de dados entre Projetos e perfis (com usuários reais criados e descartados), rotas protegidas, rejeição do webhook sem assinatura, responsividade (mobile/tablet/desktop), acessibilidade básica, ausência de erros de console. Encontrado e corrigido 1 bug importante: tabelas cortavam colunas em mobile (375px) por causa de `overflow-hidden` sem scroll — agora com `overflow-x-auto`.
- [x] Auditoria de segurança (Kerberos) — aprovado após correções. Achados e corrigidos:
  - 🔴 **Crítico**: `criarUsuario` não checava se quem chamava a Server Action era Administrador — permitia escalação de privilégio via chamada direta à action (bypass da tela). Corrigido com checagem de `perfil === 'admin'` via `getUsuarioAtual()` antes de qualquer operação com `service_role`.
  - 🟡 Busca da Base de Conhecimento interpolava entrada do usuário direto no filtro `.or()` do PostgREST (injeção de sintaxe de filtro, contida pelo RLS mas padrão perigoso) — trocada por filtro em memória.
  - 🟡 Faltavam headers de segurança HTTP e `X-Powered-By` vazava a stack — adicionados `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` no `next.config.ts`.
  - ✅ Sem secrets vazados (histórico git completo), 0 achados no Semgrep (117 regras OWASP/Next.js/React), RLS 100% habilitado, funções `SECURITY DEFINER` com `search_path` fixo, CVE-2025-29927 testado e não reproduz, CSRF coberto pela proteção nativa de Server Actions.
  - 🟢 Observação: vulnerabilidade moderada de XSS no `postcss` (dependência interna do Next.js, não nossa) — risco real baixo (só afeta build time), monitorar atualização do Next.js.
- [x] Merge `dev → hml` → `hml → main` — backups criados antes de cada etapa (`backup-pre-hml-20260709-165758`, `backup-pre-main-20260709-165918`), confirmação explícita de Rafael obtida antes do merge final
- [x] Deploy em produção (Vercel) — build automático disparado pelo push em `main`, concluído com sucesso

**Incidente resolvido durante o deploy:** a URL de produção estava atrás da proteção "Vercel Authentication" (Deployment Protection), redirecionando qualquer visitante — inclusive Rafael — pro login da própria Vercel em vez do `/login` da aplicação. Rafael desabilitou em `Project Settings → Deployment Protection`. Confirmado depois: `/login` responde 200 com conteúdo correto, headers de segurança presentes, webhook rejeita requisição sem assinatura (400), e login end-to-end testado com a conta Admin real direto na URL de produção — sem erros de console.

**🎉 Sistema em produção:** https://hubtech-itsm-hub-tech-oficial.vercel.app

---

# Expansão V1.1 (pós-lançamento)

Levantada por Rafael após ver a V1 em produção, usando o Jira como referência de UX. Ver `docs/memoria/projeto.md` e `moscow.md` para a spec completa.

### 🔵 FASE 07: PERFIL TÉCNICO E FILA COMPARTILHADA
**Status:** ⏳ Aguardando
**Progresso:** 0/6 tarefas (0%)

#### Tarefas:
- [ ] Migration: novo valor `tecnico` no enum de perfil, tabela `tecnico_projetos` (vínculo N:N), coluna `atribuido_a_usuario_id` em `chamados`
- [ ] RLS: Técnico vê/interage em todos os chamados dos Projetos vinculados a ele (sem restrição de Grupo)
- [ ] Ação "pegar chamado" (auto-atribuição) e "devolver à fila"
- [ ] Ordenação da fila: prioridade (desc) + criado (asc)
- [ ] Filtros rápidos: "Meus chamados", "Não atribuídos", "Todos do Projeto"
- [ ] Cadastro de vínculo Técnico ↔ Projeto pelo Administrador (`/admin`)

### 🔵 FASE 08: PORTAL DE ABERTURA E TIPO DE ITEM
**Status:** ⏳ Aguardando
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] Abertura de chamado direto pelo portal, para todos os perfis
- [ ] Campo "Tipo de Item" (Incidente / Solicitação de Serviço / Dúvida)
- [ ] Código curto sequencial por Projeto (ex: `CUR-1`, `SEM-1`)
- [ ] Coluna "Responsável" na listagem de chamados

### 🔵 FASE 09: NAVEGAÇÃO E PERFIL
**Status:** ⏳ Aguardando
**Progresso:** 0/3 tarefas (0%)

#### Tarefas:
- [ ] Seletor de Projeto no topo (Técnicos com mais de 1 Projeto vinculado)
- [ ] Menu de perfil (canto superior direito) com link pra configurações
- [ ] Tela de configurações de conta: foto de perfil, trocar senha

### 🔵 FASE 10: PAINÉIS (DASHBOARDS)
**Status:** ⏳ Aguardando
**Progresso:** 0/1 tarefa (0%)

#### Tarefas:
- [ ] Dashboard por perfil — cartões coloridos + contagens (Básico: próprios · Supervisor: do Grupo · Técnico: fila do Projeto selecionado · Admin: visão geral)

### 🔵 FASE 11: ANEXOS
**Status:** ⏳ Aguardando (SHOULD HAVE — aprovado por Rafael após parecer técnico do Hades)
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] Bucket no Supabase Storage + policies espelhando a visibilidade de `chamados`
- [ ] Captura de anexos vindos por e-mail (API de Attachments do Resend)
- [ ] Upload de anexo pelo portal (criação de chamado e comentário)
- [ ] Exibição/download de anexo na tela de detalhe do chamado

### 🔵 FASE 12: PRODUÇÃO (FINAL DA V1.1)
**Status:** ⏳ Aguardando
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] QA funcional completo (Ravena)
- [ ] Auditoria de segurança (Kerberos) — atenção especial ao RLS do perfil Técnico e às policies do Storage
- [ ] Merge `dev → hml → main`
- [ ] Deploy em produção (Vercel)

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-07-08 | Shiva conduziu Descoberta completa e formalizou spec (projeto.md, moscow.md, design-system.json). Hades recebeu a spec e definiu stack + roadmap faseado. |
| 2026-07-08 | Atlas executou e concluiu a Fase 01: repositório GitHub, scaffold Next.js, Supabase (schema + RLS aplicados em produção), design tokens, autenticação, Vercel linkado com env vars, GitFlow (dev/hml/main) publicado. |
| 2026-07-09 | Fases 02 a 05 concluídas (ingestão por e-mail, SLA/notificações, portal com 3 perfis, Base de Conhecimento). Ravena aprovou QA com navegador real (1 bug de mobile corrigido). Kerberos aprovou segurança após corrigir 1 falha crítica de escalação de privilégio e 2 importantes. Merge `dev → hml → main` com aprovação explícita de Rafael. Deploy em produção concluído após resolver bloqueio de Deployment Protection do Vercel. **V1 do Hub Tech ITSM está no ar.** |
| 2026-07-10 | Rafael trouxe feedback pós-lançamento usando o Jira como referência. Shiva conduziu nova Descoberta: perfil Técnico (multi-Projeto), abertura de chamado pelo portal pra todos, painéis por perfil, navegação com seletor de Projeto, menu de perfil. Hades avaliou viabilidade de anexos (aprovado como SHOULD HAVE, Supabase Storage, custo zero) e definiu roadmap da V1.1 (Fases 07-12), aprovado por Rafael. |
