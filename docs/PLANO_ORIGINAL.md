# Plano para o Codex — Central de Operação e Visão da Gestão

## Objetivo e ordem de entrega

Criar primeiro uma aplicação web responsiva para **administração e síndico** de um condomínio. A administração opera o dia a dia; o síndico acompanha, decide e aprova conforme regras configuradas. O aplicativo do **morador/proprietário será outro projeto ou outra interface, construído depois**, compartilhando o mesmo modelo de dados e as mesmas APIs quando necessário. Não construir as telas do morador nesta fase.

O sistema precisa funcionar em computador e celular, com dados reais, estados vazios, carregamento e tratamento de erros. Não inventar números, despesas, estoque, ocorrências ou usuários para o painel de produção. Qualquer dado de demonstração deve ser claramente marcado e isolado.

## Perfis e limites

- **Administrador:** gerencia unidades e contatos, publica documentos e comunicados, recebe solicitações, organiza serviços, atribui responsáveis e confere registros e indicadores.
- **Síndico:** vê a gestão geral, pendências e histórico, acompanha serviços, aprova publicações, despesas ou serviços somente quando configurado, e acessa relatórios.
- **Operador da administração:** executa ações delegadas; não recebe acesso amplo por padrão.
- **Morador/proprietário:** cadastro e vínculo de unidade já previstos no modelo, porém sem interface própria nesta entrega. A publicação direcionada deve preparar a distribuição futura ao app do morador.

Definir permissões por papel **e por ação**, no servidor e no banco; esconder um botão não constitui autorização. Registros sensíveis não devem aparecer a outros condomínios ou unidades. Guardar quem criou, alterou, aprovou e concluiu cada registro, com data e hora.

## Navegação e telas

### Administração — Central de Operação

1. **Dashboard:** cards de solicitações abertas, aguardando resposta, serviços planejados hoje, serviços concluídos hoje e comunicados pendentes de publicação/aviso. Indicadores clicáveis abrem listas filtradas. Gráfico simples de solicitações por status e evolução no período, sempre calculado de dados existentes.
2. **Comunicados:** lista, rascunho, editor, anexos, público-alvo (todos/bloco/unidades), prévia dos destinatários, aprovação opcional, publicação, versões e histórico de distribuição e ciência. Separar `publicado`, `notificação enviada`, `visualizado` e `ciência confirmada`. Avisos urgentes destacam destinatários não alcançados; não afirmar entrega sem evento do canal.
3. **Documentos:** categorias, publicação com versão, público-alvo, arquivo e histórico. Permitir substituir por nova versão sem apagar a anterior. Atas e regimento são exemplos; não criar votação digital nesta fase.
4. **Solicitações:** lista com filtros e detalhes; protocolo, assunto, descrição, anexos, prioridade, unidade, responsável, status e mensagens internas/externas. Estados mínimos: `aberta`, `em atendimento`, `aguardando informação`, `resolvida`, `cancelada`. Cada transição gera histórico.
5. **Serviços:** quadro de `a fazer`, `em andamento`, `concluído`, `cancelado`; descrição, local, prioridade, responsável, prazo, origem (solicitação ou criação interna), fotos antes/depois e observações. Para tarefas do dia, registrar início, conclusão e quem executou. Serviço concluído exige responsável e evidência/justificativa configurável. Permitir reabrir com motivo.
6. **Checklist diário:** itens definidos pela administração para rotinas gerais; conclusão com responsável, horário, observação e foto opcional. Checklist não deve criar automaticamente despesa, movimentação de estoque ou ordem especializada.
7. **Unidades e pessoas:** condomínio, blocos, unidades, contatos e vínculos (proprietário, morador, contato autorizado); uma pessoa pode estar vinculada a mais de uma unidade e uma unidade a várias pessoas. Registro de validação do vínculo.
8. **Relatórios e auditoria:** filtros por período, status, responsável e bloco; exportação em formato adequado somente se autorizado. Mostrar volume de solicitações, conclusão de serviços e alcance de comunicados; registrar eventos importantes.

### Síndico — Visão da Gestão

1. **Dashboard:** cards de solicitações abertas/atrasadas, serviços planejados/concluídos no período, aprovações pendentes e comunicados com baixa confirmação de ciência; gráficos por período e categoria.
2. **Aprovações:** fila de publicações, serviços ou despesas **quando** a regra do condomínio exigir aprovação. Decisão com autor, data e justificativa.
3. **Serviços e checklists:** leitura do quadro, detalhes, fotos, responsável, histórico e pendências. Possibilidade de solicitar revisão ou aprovar conforme papel.
4. **Comunicação e documentos:** consultar o que foi publicado, público, versões e alcance; criar ou aprovar conforme permissão.
5. **Relatórios:** tendências, filtros e detalhes verificáveis; cada card deve levar aos registros que formam o número.

Não presumir que todo síndico tenha permissão de editar todos os dados. Essa matriz precisa ser configurável por condomínio.

## Fluxos completos da primeira entrega

### Comunicado

Rascunho → seleção de público → prévia (quantidade de unidades/pessoas) → aprovação opcional → publicação → registro de eventos de aviso/abertura/ciência → acompanhamento de pendentes → nova versão, se houver mudança substancial. Registrar o texto e anexos de cada versão. Se ainda não houver app do morador ou integração de mensagens, mostrar `publicado no sistema, aviso externo não configurado`; não marcar como entregue.

### Solicitação → serviço

Solicitação recebida ou criada internamente → triagem → responsável e prazo → possível criação de serviço vinculado → checklist/evidências → conclusão → revisão/encerramento. A solicitação e o serviço mantêm IDs próprios; o histórico deixa clara sua relação. O usuário responsável pela conclusão e as fotos são exibidos ao síndico conforme permissão.

### Checklist diário

Modelo de checklist → geração dos itens do dia → execução por responsável → registro de horário, observação e foto → validação, quando exigida → painel de feitos e pendentes. Não reescrever uma execução anterior quando o modelo do checklist for editado.

## Dashboard financeiro e integração com Almox Aqua — FUTURO, BLOQUEADO

Deixar **prevista** uma seção identificada como `Custos e materiais (integração futura)` na navegação e no planejamento técnico. **Não simular valores nem exibir cards com números fictícios em produção.** Pode haver um estado informativo `Integração ainda não ativada`, sem chamadas a APIs inexistentes.

Quando ativada, a visão de gestão deverá mostrar, por período e serviço: custo registrado no dia, custo acumulado, materiais retirados, quantidades, unidade de medida, valor associado (somente se existir preço/custo confiável), responsável pela retirada, destino e vínculo com o serviço. Permitir clicar no total para ver as movimentações de origem. O Almox Aqua será a fonte das movimentações de estoque; estabelecer API/contrato e identificadores antes de integrar. Evitar duplicar lançamento e definir regras para cancelamentos, ajustes de estoque e divergência de datas. O valor de material retirado não equivale automaticamente a dinheiro pago naquele dia; despesas e consumo de estoque devem ser apresentados separadamente.

Não desenvolver essa integração na primeira entrega. Não modificar o Almox Aqua por causa deste plano sem uma tarefa específica posterior.

## Modelo de dados inicial (nomes ilustrativos)

`condominiums`, `blocks`, `units`, `people`, `unit_memberships`, `users`, `role_permissions`, `announcements`, `announcement_versions`, `announcement_recipients`, `announcement_events`, `documents`, `document_versions`, `requests`, `request_messages`, `services`, `service_events`, `service_photos`, `checklist_templates`, `checklist_items`, `checklist_runs`, `checklist_results`, `approvals`, `audit_events`.

Cada tabela operacional tem `condominium_id`, identificador estável, datas e autoria. Não confiar no `condominium_id` enviado pelo navegador para autorizar operações. Anexos usam armazenamento privado com acesso temporário/autorizado. Futuros registros de custo e estoque devem ter referência ao serviço e ao registro original no sistema fonte.

## Estrutura técnica sugerida

Stack: Next.js com App Router e TypeScript, Supabase Auth/Postgres/Storage, UI responsiva. Separar componentes de tela, regras de domínio, acesso ao banco e integrações. Para dados mutáveis e operações sensíveis, verificar a sessão e a permissão no servidor. Aplicar políticas de Row Level Security no Supabase e testar isolamento entre condomínios e papéis. Guardar credenciais e chaves privilegiadas somente no servidor.

```text
src/
  app/
    (auth)/entrar/
    (admin)/painel/
    (admin)/comunicados/
    (admin)/documentos/
    (admin)/solicitacoes/
    (admin)/servicos/
    (admin)/checklists/
    (admin)/unidades/
    (admin)/relatorios/
    (sindico)/painel/
    (sindico)/aprovacoes/
    (sindico)/servicos/
    (sindico)/relatorios/
    api/integracoes/
  components/{layout,cards,charts,forms,tables,states}/
  features/{auth,permissions,units,announcements,documents,requests,services,checklists,approvals,reports}/
  lib/{supabase,validation,audit}/
  types/
supabase/migrations/
```

A estrutura de rotas é uma sugestão, não uma exigência literal. Evitar duplicar lógica de serviços e comunicados entre as telas de administração e síndico: ambos devem usar os mesmos módulos de domínio com permissões distintas. Preparar consultas agregadas para dashboards com filtros de período e indicador de última atualização.

## Ordem de implementação e critérios de aceite

1. **Descoberta:** confirmar regras de cadastro, publicação, aprovação, prioridades e responsáveis com a administração e o síndico. Entregar fluxos e matriz de permissões revisáveis.
2. **Protótipo:** telas responsivas de ambos os perfis, com estados vazios e exemplos identificados como demonstração. Validar navegação no celular e no computador antes de conectar dados.
3. **Base segura:** autenticação, condomínio/unidades/pessoas, vínculos, papéis, políticas RLS, anexos privados e auditoria.
4. **Comunicação:** rascunhos, versões, público-alvo, publicação e indicadores fiéis aos eventos realmente capturados.
5. **Operação:** solicitações, serviços, checklists, fotos e atribuição, incluindo passagem de solicitação para serviço.
6. **Visão do síndico:** indicadores conferidos com listas de origem, aprovações opcionais e relatórios.
7. **Piloto:** validar com poucos usuários autorizados. Testar conta sem unidade, pessoa com duas unidades, síndico sem permissão de edição, edição de comunicado publicado, serviço reaberto, foto privada e ausência de dados de custo/estoque.

Critério central: a administração consegue organizar e comprovar um comunicado e um serviço completo; o síndico consegue acompanhar os mesmos registros e identificar o que está pendente, sem ver métricas inventadas nem dados fora de sua permissão.

## Instrução para o Codex executor

Antes de implementar, inspecione o repositório e as instruções locais. Se não existir repositório escolhido, prepare um plano de implementação e uma proposta de interface para revisão. Não publicar, integrar WhatsApp, criar o app do morador ou alterar Almox Aqua como parte desta primeira entrega. Preserve os módulos futuros descritos acima na documentação e deixe explícitas as decisões que dependem de regras reais do condomínio.
