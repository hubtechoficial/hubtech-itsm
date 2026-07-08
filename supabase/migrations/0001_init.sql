-- Hub Tech ITSM — schema inicial (Fase 01)
-- Multi-tenant por Projeto (contrato). Ver docs/memoria/projeto.md e moscow.md.

create extension if not exists pgcrypto;

create type perfil_usuario as enum ('basico', 'supervisor', 'admin');
create type status_chamado as enum ('aberto', 'em_andamento', 'resolvido', 'fechado');
create type prioridade_chamado as enum ('baixa', 'media', 'alta', 'critica');
create type canal_mensagem as enum ('email', 'portal', 'sistema');

-- ============================================================
-- TABELAS
-- ============================================================

create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dominios_email text[] not null default '{}',
  sla_resposta_minutos int,
  sla_resolucao_minutos int,
  created_at timestamptz not null default now()
);

create table grupos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  unique (projeto_id, nome)
);

-- Perfil de cada usuário autenticado (1:1 com auth.users).
-- perfil = 'admin' (time Hub Tech) não pertence a um único Projeto: enxerga todos.
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  projeto_id uuid references projetos(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete set null,
  perfil perfil_usuario not null default 'basico',
  nome text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint usuarios_admin_sem_projeto check (
    (perfil = 'admin' and projeto_id is null)
    or (perfil <> 'admin' and projeto_id is not null)
  )
);

create table chamados (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete set null,
  aberto_por_usuario_id uuid references usuarios(id) on delete set null,
  email_remetente text not null,
  assunto text not null,
  status status_chamado not null default 'aberto',
  prioridade prioridade_chamado not null default 'media',
  email_thread_id text,
  sla_prazo_resposta timestamptz,
  sla_prazo_resolucao timestamptz,
  primeira_resposta_em timestamptz,
  resolvido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chamados_projeto_idx on chamados (projeto_id);
create index chamados_thread_idx on chamados (email_thread_id);

create table chamado_mensagens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  autor_usuario_id uuid references usuarios(id) on delete set null,
  autor_email text,
  corpo text not null,
  canal canal_mensagem not null default 'portal',
  created_at timestamptz not null default now()
);

create index mensagens_chamado_idx on chamado_mensagens (chamado_id);

-- Base de conhecimento (uso interno do time técnico da Hub Tech na v1)
create table artigos_conhecimento (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  conteudo text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at automático
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger chamados_set_updated_at
before update on chamados
for each row execute function set_updated_at();

create trigger artigos_set_updated_at
before update on artigos_conhecimento
for each row execute function set_updated_at();

-- ============================================================
-- Funções auxiliares (security definer — evita recursão de RLS
-- ao consultar a própria linha em `usuarios`)
-- ============================================================

create or replace function meu_perfil()
returns perfil_usuario
language sql
security definer
stable
set search_path = public
as $$
  select perfil from usuarios where id = auth.uid();
$$;

create or replace function meu_projeto_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select projeto_id from usuarios where id = auth.uid();
$$;

create or replace function meu_grupo_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select grupo_id from usuarios where id = auth.uid();
$$;

-- ============================================================
-- RLS — isolamento total por Projeto (regra estrutural do produto)
-- ============================================================

alter table projetos enable row level security;
alter table grupos enable row level security;
alter table usuarios enable row level security;
alter table chamados enable row level security;
alter table chamado_mensagens enable row level security;
alter table artigos_conhecimento enable row level security;

-- projetos
create policy projetos_select on projetos for select
  using (meu_perfil() = 'admin' or id = meu_projeto_id());

create policy projetos_admin_all on projetos for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- grupos
create policy grupos_select on grupos for select
  using (meu_perfil() = 'admin' or projeto_id = meu_projeto_id());

create policy grupos_admin_all on grupos for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- usuarios: cada um vê a si mesmo; supervisor vê o próprio grupo; admin vê tudo
create policy usuarios_select on usuarios for select
  using (
    meu_perfil() = 'admin'
    or id = auth.uid()
    or (meu_perfil() = 'supervisor' and projeto_id = meu_projeto_id() and grupo_id = meu_grupo_id())
  );

create policy usuarios_admin_all on usuarios for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- chamados: básico só os seus; supervisor os seus + do grupo; admin tudo.
-- Nunca atravessa Projeto, exceto para o admin.
create policy chamados_select on chamados for select
  using (
    meu_perfil() = 'admin'
    or (
      projeto_id = meu_projeto_id()
      and (
        aberto_por_usuario_id = auth.uid()
        or (meu_perfil() = 'supervisor' and grupo_id = meu_grupo_id())
      )
    )
  );

create policy chamados_supervisor_update on chamados for update
  using (
    meu_perfil() = 'admin'
    or (meu_perfil() = 'supervisor' and projeto_id = meu_projeto_id() and grupo_id = meu_grupo_id())
  );

create policy chamados_admin_all on chamados for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- chamado_mensagens: segue a visibilidade do chamado pai
create policy mensagens_select on chamado_mensagens for select
  using (
    exists (
      select 1 from chamados c
      where c.id = chamado_mensagens.chamado_id
      and (
        meu_perfil() = 'admin'
        or (
          c.projeto_id = meu_projeto_id()
          and (c.aberto_por_usuario_id = auth.uid() or (meu_perfil() = 'supervisor' and c.grupo_id = meu_grupo_id()))
        )
      )
    )
  );

create policy mensagens_insert on chamado_mensagens for insert
  with check (
    exists (
      select 1 from chamados c
      where c.id = chamado_mensagens.chamado_id
      and (
        meu_perfil() = 'admin'
        or (meu_perfil() = 'supervisor' and c.projeto_id = meu_projeto_id() and c.grupo_id = meu_grupo_id())
      )
    )
  );

-- artigos_conhecimento: uso interno do time técnico da Hub Tech na v1
create policy artigos_admin_all on artigos_conhecimento for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ============================================================
-- Seed inicial — Projetos (contratos ativos)
-- ============================================================

insert into projetos (nome, dominios_email, sla_resposta_minutos, sla_resolucao_minutos) values
  ('Cúria', array['arquidiocesedebrasilia.org.br'], 120, 240),
  ('Seminário', array['seminario.org.br'], null, null);

-- NOTA: o domínio do Seminário ainda é um placeholder — confirmar o domínio
-- real de e-mail institucional antes de ir para produção.
