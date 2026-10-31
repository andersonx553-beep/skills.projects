# Brief para eventual continuação no Lovable

Referência opcional: a implementação desta sessão foi feita diretamente no repositório, por escolha do usuário. Nenhum projeto foi criado no Lovable.

Criar “Central Condomínio”, aplicação SaaS responsiva em português do Brasil para administração e síndico. Usar `PLANO_ORIGINAL.md` como requisitos de produto e `IMPLEMENTACAO.md` como proposta técnica e roteiro de aceite. Não alegar que os documentos substituem implementação ou testes.

Implementar os módulos conectados ao mesmo backend: Dashboard, Comunicados, Documentos, Solicitações, Serviços, Checklist diário, Unidades e pessoas, Aprovações, Relatórios e auditoria, Configurações. Reservar “Custos e materiais (integração futura)” apenas com estado informativo.

Começar por interface responsiva e estados vazios; depois implementar Supabase Auth, Postgres com RLS e Storage privado. Não simular dados no painel de produção e não usar localStorage como banco de produção. Login e troca de papel visual não substituem autenticação ou autorização. Não oferecer seleção de papel na tela de login como mecanismo de acesso.

Desenvolver fluxos de ponta a ponta, incluindo persistência, validação, loading, erros e permissão no backend. Consultar o arquivo de implementação para versionamento, aprovação opcional, público-alvo, eventos reais de comunicação, solicitação vinculada a serviço, conclusão com evidência e checklist imutável por execução.

O visual deve transmitir controle operacional: azul profundo e verde de ação, conteúdo legível, listas úteis, filtros, responsáveis, prazos e histórico visíveis. Evitar landing page comercial no lugar do sistema de gestão. Navegação lateral no desktop e menu acessível no celular.

Não construir interface do morador, votação, WhatsApp, financeiro ou integração Almox Aqua. Não acrescentar cobrança Stripe nesta fase. Não publicar sem instrução posterior. Se backend ou credenciais estiverem ausentes, declarar a limitação; não exibir sucesso fictício.

Entregar código, migrações, políticas, instruções de configuração e evidências de testes. Antes de considerar pronto, executar os cenários de isolamento, autorização e fluxos de `IMPLEMENTACAO.md`, distinguindo resultados executados de pendências.
