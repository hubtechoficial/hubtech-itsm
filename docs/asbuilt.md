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
**Status:** ✅ Concluída
**Progresso:** 6/6 tarefas (100%)

#### Tarefas:
- [x] Migration: novo valor `tecnico` no enum de perfil, tabela `tecnico_projetos` (vínculo N:N), coluna `atribuido_a_usuario_id` em `chamados` (`0004`, `0005`, aplicadas em produção)
- [x] RLS: Técnico vê/interage em todos os chamados dos Projetos vinculados a ele (sem restrição de Grupo) — testado com usuários reais, isolamento entre Projetos confirmado
- [x] Ação "pegar chamado" (auto-atribuição) e "devolver à fila" — verificado com navegador real + checagem direta no banco
- [x] Ordenação da fila: prioridade (desc) + criado (asc)
- [x] Filtros rápidos: "Meus chamados", "Não atribuídos", "Todos do Projeto"
- [x] Cadastro de vínculo Técnico ↔ Projeto pelo Administrador (`/admin/usuarios` — criação com múltiplos Projetos + adicionar/remover vínculo depois)

**Bug encontrado e corrigido durante o teste:** RLS de `projetos` não permitia ao Técnico ler os Projetos vinculados a ele (só previa Admin ou o Projeto fixo de Básico/Supervisor) — o seletor de Projeto ficava invisível porque o join retornava `null` silenciosamente. Corrigido na migration `0006`.

### 🔵 FASE 08: PORTAL DE ABERTURA E TIPO DE ITEM
**Status:** ✅ Concluída
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] Abertura de chamado direto pelo portal, para todos os perfis (`/chamados/novo`) — Projeto fixo para Básico/Supervisor, seletor para Técnico/Admin
- [x] Campo "Tipo de Item" (Incidente / Solicitação de Serviço / Dúvida)
- [x] Código curto sequencial por Projeto (ex: `CUR-1`, `SEM-1`) — trigger automático, com backfill dos chamados existentes; campo `codigo` também no cadastro de Projeto
- [x] Coluna "Responsável" na listagem de chamados — já entregue na Fase 07

Testado com navegador real (Básico e Técnico criando chamado pelo portal) e verificado que o RLS bloqueia tentativa de abrir chamado em Projeto que não é o do usuário, mesmo contornando a tela.

### 🔵 FASE 09: NAVEGAÇÃO E PERFIL
**Status:** ✅ Concluída
**Progresso:** 3/3 tarefas (100%)

#### Tarefas:
- [x] Seletor de Projeto no topo (Técnicos com mais de 1 Projeto vinculado) — já entregue na Fase 07
- [x] Menu de perfil (canto superior direito) com link pra configurações — header compartilhado em `(app)/layout.tsx`, aplicado a todas as páginas autenticadas (pastas `chamados/` e `admin/` movidas para o route group `(app)/`, URLs inalteradas)
- [x] Tela de configurações de conta: foto de perfil, trocar senha — `/configuracoes`, com upload pro bucket `avatars` do Storage e troca de nome/senha

**Migrations:** `0009` (coluna `foto_url` + bucket `avatars` com policies de Storage) e `0010` (usuário pode atualizar o próprio nome/foto).

**Ponto de atenção de segurança tratado proativamente:** uma policy de RLS comum (`using id = auth.uid()`) protegeria a *linha*, mas não a *coluna* — sem restrição adicional, o próprio usuário conseguiria se auto-promover a Administrador num UPDATE direto na tabela `usuarios`. Corrigido combinando a policy de RLS com `revoke/grant` restringindo a escrita a colunas específicas (`nome`, `foto_url`). Validado com teste de exploit real: tentativa de auto-promoção bloqueada com "permission denied for table usuarios".

**Bug encontrado e corrigido durante o teste com navegador real:** a Content-Security-Policy adicionada em `next.config.ts` (Fase 06) bloqueava o carregamento das próprias imagens de avatar, hospedadas no Supabase Storage — `img-src` não incluía `https://*.supabase.co`. Corrigido e revalidado (0 erros de console após o ajuste).

### 🔵 FASE 10: PAINÉIS (DASHBOARDS)
**Status:** ✅ Concluída
**Progresso:** 1/1 tarefa (100%)

#### Tarefas:
- [x] Dashboard por perfil — cartões coloridos + contagens (Básico: próprios · Supervisor: do Grupo · Técnico: fila do Projeto selecionado · Admin: visão geral)

Nova página `/painel`, que passou a ser a tela de entrada (`/` e o login redirecionam pra lá). Cartões de contagem por status (aberto/em andamento/resolvido/fechado) e por SLA (dentro do prazo/atenção/estourado/sem SLA/resolvido). O escopo dos dados por perfil não precisou de filtro explícito na maioria dos casos — o RLS já existente faz o trabalho (Básico só vê os próprios, Supervisor só vê do Grupo, Admin vê tudo); só o Técnico precisa do seletor de Projeto, reaproveitado da tela de fila (Fase 07). Testado com navegador real nos 4 perfis (usuários descartáveis criados e removidos ao final).

**Limpeza feita durante o teste:** o teste de upload de foto da Fase 09 tinha deixado uma imagem de teste (transparente, 1×1px) configurada como avatar real do admin `rafael@hubtech.tec.br` — corrigido (nome e foto restaurados, arquivo removido do Storage).

### 🔵 FASE 11: ANEXOS
**Status:** ✅ Concluída (SHOULD HAVE — aprovado por Rafael após parecer técnico do Hades)
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] Bucket no Supabase Storage + policies espelhando a visibilidade de `chamados` — bucket privado `anexos-chamados` (10MB/arquivo, allowlist de tipos), RLS via 2 funções `SECURITY DEFINER` (`pode_ver_chamado`/`pode_anexar_em_chamado`) reaproveitadas na tabela `chamado_anexos` e nas policies de `storage.objects`
- [x] Captura de anexos vindos por e-mail (API de Attachments do Resend) — baixa via URL assinada e sobe pro bucket, ignorado (sem travar o chamado) se o anexo for grande demais ou de tipo não permitido
- [x] Upload de anexo pelo portal (criação de chamado e comentário) — `src/lib/chamados/anexos.ts`, reaproveitado nos dois fluxos
- [x] Exibição/download de anexo na tela de detalhe do chamado — link com signed URL (bucket privado, diferente do `avatars` que é público)

**Bug crítico encontrado e corrigido no caminho (migration `0011`, antes desta feature):** a policy `mensagens_insert` nunca tinha sido atualizada quando o perfil Básico passou a poder abrir chamado pelo portal (Fase 08) — o chamado era criado, mas a descrição (primeira mensagem) era bloqueada pelo RLS e o erro não era verificado no código, então o usuário via a tela de sucesso e a descrição do problema desaparecia silenciosamente. Corrigido e verificado com teste real (usuário Básico descartável).

**🟡 Pendência de validação:** a captura de anexo vindo por e-mail não pôde ser testada ponta-a-ponta (precisa de um e-mail real recebido pela Resend com anexo — mesma limitação já registrada na validação da Fase 02). Os caminhos de erro (anexo grande demais, tipo não permitido) foram cobertos por revisão de código. Recomendo Rafael enviar um e-mail de teste real com um anexo antes da Fase 12 (Produção) para fechar essa validação.

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
| 2026-07-10 | Rafael trouxe feedback pós-lançamento usando o Jira como referência. Shiva conduziu nova Descoberta: perfil Técnico (multi-Projeto), abertura de chamado pelo portal pra todos, painéis por perfil, navegação com seletor de Projeto, menu de perfil. Hades avaliou viabilidade de anexos (aprovado como SHOULD HAVE, Supabase Storage, custo zero) e definiu roadmap da V1.1 (Fases 07-12), aprovado por Rafael. Atlas concluiu as Fases 07, 08 e 09 (perfil Técnico, portal de abertura, navegação/menu de perfil/configurações), com testes reais de navegador em cada uma e 3 bugs encontrados e corrigidos ao longo do caminho (RLS de projetos pro Técnico, CSP bloqueando avatar, e a proteção proativa contra auto-promoção via UPDATE). |
