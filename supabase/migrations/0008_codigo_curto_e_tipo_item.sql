-- Fase 08 (V1.1): tipo de item, código curto sequencial por Projeto,
-- abertura de chamado pelo portal (RLS de insert)

-- ============================================================
-- Tipo de Item
-- ============================================================

alter table chamados add column tipo_item tipo_item_chamado not null default 'incidente';

-- ============================================================
-- Código curto por Projeto (ex: CUR-1, SEM-1)
-- ============================================================

alter table projetos add column codigo text;
update projetos set codigo = 'CUR' where nome = 'Cúria';
update projetos set codigo = 'SEM' where nome = 'Seminário';
alter table projetos alter column codigo set not null;
alter table projetos add constraint projetos_codigo_unique unique (codigo);

alter table chamados add column numero integer;

create or replace function set_numero_chamado()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into new.numero
    from chamados where projeto_id = new.projeto_id;
  end if;
  return new;
end;
$$;

create trigger chamados_set_numero
before insert on chamados
for each row execute function set_numero_chamado();

-- Backfill dos chamados já existentes, numerados por ordem de criação dentro do Projeto
with numerados as (
  select id, row_number() over (partition by projeto_id order by created_at) as rn
  from chamados
)
update chamados c set numero = n.rn from numerados n where n.id = c.id;

alter table chamados alter column numero set not null;

-- ============================================================
-- RLS: abertura de chamado pelo portal (todos os perfis)
-- ============================================================

create policy chamados_insert on chamados for insert
  with check (
    meu_perfil() = 'admin'
    or (meu_perfil() = 'tecnico' and projeto_id in (select meus_projetos_tecnico()))
    or (meu_perfil() in ('basico', 'supervisor') and projeto_id = meu_projeto_id() and aberto_por_usuario_id = auth.uid())
  );
