# Hub Tech ITSM — Sistema de Registro de Chamados Técnicos

**Descrição:** Sistema de ITSM multi-tenant para os contratos de terceirização de suporte da Hub Tech. Chamados entram por e-mail institucional, ficam isolados por Projeto (contrato), com SLA configurável e portal de consulta com 3 perfis de acesso.
**Stack:** Next.js + Supabase (Postgres + Auth + RLS) + Vercel + Resend (e-mail transacional e recebimento) + GitHub (`hubtechoficial/hubtech-itsm`)
**Última atualização:** 2026-07-08

## Roadmap de Implementação

### 🔵 FASE 01: FUNDAÇÃO
**Status:** ⏳ Aguardando
**Progresso:** 0/8 tarefas (0%)

#### Tarefas:
- [ ] Setup projeto Next.js (App Router)
- [ ] Configurar Supabase (projeto + schema inicial: `projetos`, `grupos`, `usuarios`, `chamados`)
- [ ] Configurar Vercel (deploy contínuo a partir de `dev`)
- [ ] GitFlow (`dev`, `hml`, `main`) no repo `hubtechoficial/hubtech-itsm`
- [ ] Aplicar design tokens (design-system.json / design-tokens.css)
- [ ] Autenticação via Supabase Auth (usuário/senha) + recuperação de senha
- [ ] RLS: isolamento total de dados por `projeto_id`
- [ ] Seed inicial: Projeto "Cúria" e Projeto "Seminário" com domínios autorizados

### 🔵 FASE 02: INGESTÃO DE CHAMADO POR E-MAIL
**Status:** ⏳ Aguardando
**Progresso:** 0/5 tarefas (0%)

#### Tarefas:
- [ ] Configurar domínio de recebimento (subdomínio dedicado, ex: `suporte.hubtech.tec.br`) no Resend
- [ ] Webhook de recebimento de e-mail → validação de domínio contra Projeto
- [ ] Criação de chamado a partir de e-mail novo
- [ ] Encadeamento de resposta em chamado existente (por thread/assunto)
- [ ] Resposta automática de rejeição para domínio não autorizado

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
