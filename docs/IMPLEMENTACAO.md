# Central Condomínio — especificação de implementação

Status: implementação direta no repositório autorizada pelo usuário e realizada. O Lovable não estava disponível e não foi utilizado. Consulte o README para o que foi implementado, testes e limitações. Supabase hospedado e publicação permanecem pendentes. Este documento descreve a proposta de produto e os critérios do piloto; não comprova sozinho que todos os critérios foram validados.

## Escopo da primeira versão

Aplicação responsiva em português do Brasil para administração, síndico e operadores autorizados. O plano original está em `PLANO_ORIGINAL.md`.

Inclui painel operacional, comunicados, documentos, solicitações, serviços, checklists, unidades e pessoas, aprovações, relatórios, auditoria e configurações de permissões.

Não inclui interface do morador, votação, WhatsApp, integração Almox Aqua, financeiro operacional, cobrança de moradores ou assinatura comercial do SaaS. A instalação de uma skill de Stripe não autoriza acrescentar pagamentos ao escopo. Custos e materiais recebe apenas uma página informativa de integração futura.

## Direção de interface proposta

Nome de trabalho: Central Condomínio. Interface de operação, com prioridade para pendências, responsáveis e comprovação da execução.

- Paleta: azul profundo `#183B56`, verde de ação `#087F74`, fundo `#F5F7FA`, texto `#172B3A`, alerta `#A85D00`, erro `#B42318`. Validar contraste nas combinações efetivamente utilizadas.
- Tipografia: Source Sans 3 para leitura e formulários, com alternativa de sistema sem dependência de fonte externa.
- Desktop: navegação lateral, cabeçalho com condomínio e perfil autenticado, conteúdo alinhado à esquerda, filtros persistidos na URL e painel de detalhe com histórico.
- Celular: menu recolhível, filtros em painel e listas legíveis sem exigir tabelas largas. Ações primárias acessíveis por toque.
- Quadro de serviços: colunas por estado; oferecer mudança de estado por botão/menu, sem depender de arrastar.
- Estados: carregando, vazio com ação autorizada, erro com tentativa novamente, sem permissão, integração não configurada.
- Produção começa sem registros. Não inserir condomínios, usuários ou indicadores fictícios. Demonstração, se necessária, usa ambiente separado e rótulo permanente.

## Matriz inicial de permissões proposta

Esta matriz é um ponto de partida configurável, não uma regra confirmada pelo condomínio.

| Ação | Administrador | Síndico | Operador |
|---|---|---|---|
| Consultar indicadores e registros | Sim | Sim | Somente escopo delegado |
| Gerenciar blocos, unidades e vínculos | Sim | Não por padrão | Não por padrão |
| Criar comunicados/documentos | Sim | Somente concessão explícita | Somente concessão explícita |
| Publicar comunicados/documentos | Sim, respeitando aprovação | Somente concessão explícita | Não por padrão |
| Triar e atribuir solicitações | Sim | Não por padrão | Somente concessão explícita |
| Executar serviços/checklists | Sim | Somente concessão explícita | Somente registros atribuídos |
| Aprovar | Somente concessão explícita | Quando regra e permissão autorizarem | Não por padrão |
| Exportar relatórios | Permissão específica | Permissão específica | Não por padrão |
| Gerenciar papéis e regras | Permissão administrativa específica | Não por padrão | Não |
| Alterar/apagar auditoria | Não | Não | Não |

Negação por padrão. As permissões são verificadas na camada de domínio e no banco, não apenas na interface. Ninguém pode conceder a si mesmo privilégios ou forjar o autor de eventos. Mudanças de permissões são auditadas.

## Arquitetura e identidade

A sugestão original é Next.js App Router, TypeScript e Supabase Auth/Postgres/Storage. Se a criação no Lovable exigir outra stack, registrar a escolha e manter os contratos de domínio e a segurança; não apresentar um frontend React como um backend Next.js implementado.

Usar Supabase Auth como provedor único nesta versão. As skills de Better Auth ficam disponíveis para outros projetos; não misturar dois provedores de sessão neste aplicativo sem uma necessidade explícita.

Toda operação recebe uma sessão verificada. O condomínio ativo é validado contra vínculos ativos do usuário. Um `condominium_id` enviado pelo navegador nunca basta para autorizar acesso. Usar RLS em todas as tabelas expostas e funções transacionais para operações que combinam mudança de estado, histórico e auditoria.

Chaves administrativas ficam apenas no servidor. Operações comuns usam a identidade do usuário e não uma chave que ignora RLS. Cadastro do primeiro administrador precisa de fluxo seguro de bootstrap, sem registro público que permita escolher papel ou ingressar em condomínio arbitrário.

## Dados e invariantes

Entidades principais do plano: condomínios, blocos, unidades, pessoas, vínculos, usuários, permissões, comunicados e versões, destinatários e eventos, documentos e versões, solicitações e mensagens, serviços e eventos/fotos, modelos e execuções de checklist, aprovações e auditoria.

Complementos necessários: membros administrativos por condomínio, regras do condomínio, metadados de anexos privados e histórico das solicitações. São distintos de vínculos de pessoas a unidades.

- UUIDs estáveis; datas `timestamptz`; autoria derivada da sessão.
- Chaves estrangeiras compostas com `condominium_id` impedem relacionar unidade, pessoa, serviço ou anexo de outro condomínio.
- Índices iniciados por condomínio nas consultas recorrentes; índices nos campos usados pelas políticas RLS.
- Uma pessoa pode ter múltiplos vínculos. Contas administrativas não precisam de unidade.
- Vínculo de unidade possui situação de validação, autor e data.
- Alterar conteúdo publicado cria nova versão imutável. Aprovação referencia a versão exata e perde validade para uma nova versão.
- Publicar gera uma fotografia dos destinatários elegíveis; mudanças posteriores nos vínculos não reescrevem essa fotografia.
- Histórico e auditoria são append-only, gravados no backend/banco, com transações atômicas.
- Evitar exclusão definitiva de registros com dependências; oferecer arquivamento quando apropriado.
- Arquivos ficam em bucket privado, com caminhos e metadados vinculados ao condomínio e registro de origem. Download exige permissão atual e URL assinada de curta duração.
- Validar tipo, tamanho, extensão e nome do anexo; não confiar no MIME informado pelo cliente.
- Não copiar credenciais ou dados pessoais para logs. Exportação exige permissão e gera evento de auditoria.

## Fluxos

### Comunicado e documento

Salvar rascunho → selecionar todos/blocos/unidades → conferir destinatários → solicitar aprovação se configurada → publicar versão autorizada → consultar eventos reais.

Separar publicação, envio de aviso, abertura e ciência. Sem canal integrado, mostrar “Publicado no sistema, aviso externo não configurado”. Não criar eventos falsos nem afirmar entrega. Mudança substancial cria nova versão e nova avaliação da aprovação.

Documentos preservam arquivos e versões anteriores. Não sobrescrever objeto de storage para simular versionamento.

### Solicitação e serviço

Solicitação tem protocolo único por condomínio, prioridade, unidade opcional, responsável, prazo, anexos e mensagens classificadas como internas ou externas. Estados: aberta, em atendimento, aguardando informação, resolvida e cancelada.

Triar → atribuir → criar serviço vinculado, se necessário → executar → registrar evidências → revisar → encerrar. A relação mantém IDs distintos. Criar o serviço e seu vínculo deve ser uma operação atômica e resistente a clique duplicado.

Serviço: a fazer, em andamento, concluído e cancelado. Início e conclusão guardam executor e horário. Conclusão verifica responsável e evidência ou justificativa segundo regra configurada. Reabertura exige motivo e evento, preservando a conclusão anterior no histórico.

### Checklist

Modelo versionado → gerar execução do dia sem duplicar → copiar itens para a execução → atribuir → concluir com horário e evidência opcional → validar se exigido. Editar modelo não altera execução passada. A data operacional usa o fuso configurado do condomínio, não o relógio do navegador.

### Aprovação

Fila existe apenas para regras ativadas. Decisão exige permissão, estado pendente e versão atual. Registrar aprovador, instante e justificativa. Concorrência não pode produzir duas decisões finais. Propor impedir autoaprovação por padrão, com regra explícita e auditada caso o condomínio decida permitir.

### Indicadores

Contagens, gráficos e relatórios partem das mesmas consultas e filtros usados nas listas de origem. Cada indicador abre a lista filtrada correspondente. Mostrar período, fuso e atualização. Ausência de dados produz zero ou estado vazio; erro não pode ser apresentado como zero confirmado.

## Etapas de construção

1. Shell responsivo, navegação e estados vazios de todos os módulos.
2. Auth, bootstrap, associação administrativa ao condomínio, matriz de permissões, RLS, storage privado e auditoria.
3. Blocos, unidades, pessoas e vínculos validados.
4. Comunicados/documentos com versionamento, destinatários e aprovação opcional.
5. Solicitações, serviços, fotos, histórico e checklist com snapshots.
6. Painel do síndico, aprovações, relatórios e exportação autorizada.
7. Testes funcionais e de isolamento, revisão visual e roteiro de piloto.

Não publicar automaticamente. A interface sem backend conectado deve declarar sua condição e não simular que grava dados reais.

## Validação obrigatória antes do piloto

- Dois condomínios e usuários distintos: leitura/escrita direta via API não atravessa isolamento.
- Operador delegado não altera atribuição, regras, papéis ou registros de terceiros.
- Síndico sem edição recebe negação no backend, mesmo manipulando a requisição.
- Conta sem unidade opera apenas conforme associação administrativa.
- Pessoa com duas unidades aparece corretamente na seleção de público sem eventos duplicados indevidos.
- Comunicado publicado ganha nova versão sem apagar texto, anexos, destinatários ou aprovação anteriores.
- Aprovação antiga não publica versão nova. Cliques simultâneos não duplicam publicação ou decisão.
- Serviço sem responsável/evidência obrigatória não conclui; reabertura exige motivo.
- Alteração no modelo de checklist não reescreve a execução anterior.
- URL privada não é acessível a anônimo, outro condomínio ou após expiração.
- Ciência e entrega só existem com eventos legítimos; canal ausente permanece explicitamente não configurado.
- Indicadores conferem com registros e filtros; falhas de consulta são visíveis.
- Navegação, formulários, erros e ações funcionam em celular e desktop, inclusive teclado.
- Exportação sem autorização é negada; exportação autorizada registra auditoria.
- Não há dados de custos/estoque simulados nem chamadas a uma integração inexistente.

## Pendências externas

A implementação direta já foi autorizada. Para dados reais, configurar um projeto Supabase e os bindings necessários pelo mecanismo seguro do ambiente; não enviar chaves privadas em chat. Publicação e piloto dependem dessas integrações e da execução dos testes acima.
