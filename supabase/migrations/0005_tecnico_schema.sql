-- Fase 07 (V1.1): perfil Técnico — vínculo N:N com Projetos, atribuição de chamado,
-- fila compartilhada. Depende de 0004_perfil_tecnico.sql já aplicada (novo valor
-- de enum precisa estar commitado antes de ser usado).

-- ============================================================
-- Constraint de usuarios: Técnico também não tem projeto_id fixo (como Admin)
-- ============================================================

alter table usuarios drop constraint usuarios_admin_sem_projeto;

alter table usuarios add constraint usuarios_projeto_conforme_perfil check (
  (perfil in ('admin', 'tecnico') and projeto_id is null)
  or (perfil in ('basico', 'supervisor') and projeto_id is not null)
);

-- ============================================================
-- Vínculo Técnico <-> Projeto (N:N)
-- ============================================================

create table tecnico_projetos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  projeto_id uuid not null references projetos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, projeto_id)
);

create index tecnico_projetos_usuario_idx on tecnico_projetos (usuario_id);
create index tecnico_projetos_projeto_idx on tecnico_projetos (projeto_id);

alter table tecnico_projetos enable row level security;

create policy tecnico_projetos_select_own on tecnico_projetos for select
  using (meu_perfil() = 'admin' or usuario_id = auth.uid());

create policy tecnico_projetos_admin_all on tecnico_projetos for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

-- ============================================================
-- Atribuição de chamado (fila compartilhada — começa sempre null)
-- ============================================================

alter table chamados add column atribuido_a_usuario_id uuid references usuarios(id) on delete set null;
create index chamados_atribuido_idx on chamados (atribuido_a_usuario_id);

-- ============================================================
-- Função auxiliar: projetos que o Técnico atual atende
-- ============================================================

create or replace function meus_projetos_tecnico()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select projeto_id from tecnico_projetos where usuario_id = auth.uid();
$$;

-- ============================================================
-- RLS: estende chamados e chamado_mensagens para o perfil Técnico
-- ============================================================

drop policy chamados_select on chamados;
create policy chamados_select on chamados for select
  using (
    meu_perfil() = 'admin'
    or (meu_perfil() = 'tecnico' and projeto_id in (select meus_projetos_tecnico()))
    or (
      projeto_id = meu_projeto_id()
      and (
        aberto_por_usuario_id = auth.uid()
        or (meu_perfil() = 'supervisor' and grupo_id = meu_grupo_id())
      )
    )
  );

drop policy chamados_supervisor_update on chamados;
create policy chamados_update on chamados for update
  using (
    meu_perfil() = 'admin'
    or (meu_perfil() = 'tecnico' and projeto_id in (select meus_projetos_tecnico()))
    or (meu_perfil() = 'supervisor' and projeto_id = meu_projeto_id() and grupo_id = meu_grupo_id())
  );

drop policy mensagens_select on chamado_mensagens;
create policy mensagens_select on chamado_mensagens for select
  using (
    exists (
      select 1 from chamados c
      where c.id = chamado_mensagens.chamado_id
      and (
        meu_perfil() = 'admin'
        or (meu_perfil() = 'tecnico' and c.projeto_id in (select meus_projetos_tecnico()))
        or (
          c.projeto_id = meu_projeto_id()
          and (c.aberto_por_usuario_id = auth.uid() or (meu_perfil() = 'supervisor' and c.grupo_id = meu_grupo_id()))
        )
      )
    )
  );

drop policy mensagens_insert on chamado_mensagens;
create policy mensagens_insert on chamado_mensagens for insert
  with check (
    exists (
      select 1 from chamados c
      where c.id = chamado_mensagens.chamado_id
      and (
        meu_perfil() = 'admin'
        or (meu_perfil() = 'tecnico' and c.projeto_id in (select meus_projetos_tecnico()))
        or (meu_perfil() = 'supervisor' and c.projeto_id = meu_projeto_id() and c.grupo_id = meu_grupo_id())
      )
    )
  );
