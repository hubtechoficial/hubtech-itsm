# Priorização MoSCoW — Hub Tech ITSM (V1)

## MUST HAVE
1. Abertura de chamado por e-mail, com validação de domínio institucional por Projeto (contrato)
2. Resposta automática de rejeição para e-mail de domínio não autorizado
3. Encadeamento de respostas no mesmo chamado (sem duplicar chamado por resposta de e-mail)
4. Categorização e priorização do chamado
5. SLA configurável por Projeto (resposta / resolução), com alerta visual antes de estourar o prazo — exibe "SLA a definir" quando o Projeto ainda não tiver prazos configurados
6. Roteamento automático do chamado para o time técnico da Hub Tech
7. Base de conhecimento para consulta do time técnico
8. Notificações por e-mail a cada atualização relevante do chamado
9. Portal com login por usuário e senha (contas provisionadas pelo Administrador)
10. Recuperação de senha ("esqueci minha senha")
11. Isolamento total de dados por Projeto (multi-tenant) — nenhum usuário enxerga dados de um Projeto que não seja o seu
12. Três perfis de acesso: Básico (próprios chamados), Supervisor (próprios + do seu Grupo/Setor, com poder de interagir), Administrador (acesso total)
13. Cadastro de Projetos, Grupos/Setores e Usuários pelo Administrador

## SHOULD HAVE
- Catálogo de solicitações padronizadas (separar "incidente" de "pedido de serviço", ex: reset de senha)
- Filtro e busca no portal (por status, por data)

## COULD HAVE
- Abertura de chamado diretamente pelo portal (hoje só por e-mail)
- Pesquisa de satisfação (CSAT) ao fechar o chamado

## WON'T HAVE (por agora)
- Gestão de Problemas, Gestão de Mudanças e Gestão de Ativos (CMDB)
- Canais adicionais de abertura (WhatsApp, Teams etc.)
- Autocadastro de usuários no portal (contas são sempre provisionadas pelo Administrador na v1)
