-- Corrige o domínio de e-mail institucional da Cúria, seedado incorretamente na 0001.
update projetos
set dominios_email = array['arquidiocesedebrasilia.org.br']
where nome = 'Cúria';
