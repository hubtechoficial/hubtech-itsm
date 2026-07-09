-- Fase 05: rastreabilidade de artigos da Base de Conhecimento consultados por chamado

create table chamado_artigos_consultados (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references chamados(id) on delete cascade,
  artigo_id uuid not null references artigos_conhecimento(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (chamado_id, artigo_id)
);

create index chamado_artigos_consultados_chamado_idx on chamado_artigos_consultados (chamado_id);

alter table chamado_artigos_consultados enable row level security;

-- Mesma regra de acesso dos artigos: uso interno do time técnico (perfil admin)
create policy chamado_artigos_consultados_admin_all on chamado_artigos_consultados for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');
