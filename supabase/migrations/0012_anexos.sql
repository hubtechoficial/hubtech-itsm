-- Fase 11 (V1.1): anexos em chamados (upload pelo portal e captura de e-mail)

-- Funções SECURITY DEFINER que espelham a visibilidade/permissão já usada nas
-- policies de chamados/chamado_mensagens, reaproveitadas aqui pro bucket de anexos.
create or replace function pode_ver_chamado(p_chamado_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from chamados c
    where c.id = p_chamado_id
    and (
      meu_perfil() = 'admin'
      or (meu_perfil() = 'tecnico' and c.projeto_id in (select meus_projetos_tecnico()))
      or (
        c.projeto_id = meu_projeto_id()
        and (c.aberto_por_usuario_id = auth.uid() or (meu_perfil() = 'supervisor' and c.grupo_id = meu_grupo_id()))
      )
    )
  );
$$;

create or replace function pode_anexar_em_chamado(p_chamado_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from chamados c
    where c.id = p_chamado_id
    and (
      meu_perfil() = 'admin'
      or (meu_perfil() = 'tecnico' and c.projeto_id in (select meus_projetos_tecnico()))
      or (meu_perfil() = 'supervisor' and c.projeto_id = meu_projeto_id() and c.grupo_id = meu_grupo_id())
      or (meu_perfil() = 'basico' and c.projeto_id = meu_projeto_id() and c.aberto_por_usuario_id = auth.uid())
    )
  );
$$;

create table chamado_anexos (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  mensagem_id uuid references chamado_mensagens(id) on delete cascade,
  nome_arquivo text not null,
  tipo_conteudo text not null,
  tamanho_bytes bigint not null,
  caminho_storage text not null unique,
  origem text not null default 'portal' check (origem in ('portal', 'email')),
  enviado_por_usuario_id uuid references usuarios(id),
  created_at timestamptz not null default now()
);

create index chamado_anexos_chamado_id_idx on chamado_anexos(chamado_id);

alter table chamado_anexos enable row level security;

create policy anexos_select on chamado_anexos for select
  using (pode_ver_chamado(chamado_id));

create policy anexos_insert on chamado_anexos for insert
  with check (pode_anexar_em_chamado(chamado_id));

-- Bucket privado — diferente do avatars (público), pois um print de erro pode
-- conter dado sensível do contrato. Download só via signed URL, respeitando o RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos-chamados',
  'anexos-chamados',
  false,
  10485760, -- 10MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ]
);

-- Caminho no bucket: {chamado_id}/{uuid}-{nome_original} — a primeira pasta do
-- caminho é o chamado_id, usado pelas policies abaixo pra checar visibilidade.
create policy anexos_storage_select on storage.objects for select
  using (
    bucket_id = 'anexos-chamados'
    and pode_ver_chamado(((storage.foldername(name))[1])::uuid)
  );

create policy anexos_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'anexos-chamados'
    and pode_anexar_em_chamado(((storage.foldername(name))[1])::uuid)
  );
