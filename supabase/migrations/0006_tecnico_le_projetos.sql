-- Corrige gap de RLS: Técnico não conseguia ler os Projetos aos quais está vinculado
-- (a policy de `projetos` só previa Admin ou o próprio Projeto de Básico/Supervisor).
-- Sem isso, o join `tecnico_projetos -> projetos` retornava null pro Técnico,
-- quebrando o seletor de Projeto na navegação.

drop policy projetos_select on projetos;
create policy projetos_select on projetos for select
  using (
    meu_perfil() = 'admin'
    or id = meu_projeto_id()
    or (meu_perfil() = 'tecnico' and id in (select meus_projetos_tecnico()))
  );
