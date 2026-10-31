# Central Condomínio

Aplicação de gestão para administração e síndico, construída em Next.js, React, TypeScript e Supabase. O plano fornecido está em [docs/PLANO_ORIGINAL.md](docs/PLANO_ORIGINAL.md).

## O que foi implementado

- Dashboard com indicadores clicáveis, distribuição por status, evolução do atendimento e rotina do dia.
- Solicitações com protocolo UUID, prioridade, unidade, responsável, prazo, mensagens e histórico de transições.
- Serviços em quadro, criação a partir de solicitação, início, conclusão com evidência/justificativa e reabertura motivada.
- Comunicados e documentos com rascunhos, versões preservadas, categorias, público, prévia e aprovação opcional. Publicação não equivale a envio externo.
- Modelos de checklist e geração idempotente da execução diária com cópia independente dos itens, executor e horário.
- Blocos, unidades, pessoas e vínculos múltiplos validados.
- Aprovações por versão e por outro usuário autorizado; configuração de regras e permissões por ação.
- Relatórios filtrados, exportação CSV autorizada, auditoria administrativa e histórico de cada registro.
- Arquivos privados PDF/imagem, upload validado, acesso temporário e sem sobrescrita de evidência.
- Layout responsivo, estados vazios/carregamento/erro e conta sem unidade.

**Não está publicado nem conectado a um Supabase hospedado.** Sem configuração, a interface informa a conexão pendente e bloqueia gravação/login. Não há dados fictícios de produção. O banco e seus fluxos são testados com Postgres embarcado; isso não substitui o piloto em Supabase Auth/Storage reais.

Fora desta entrega: app do morador, votação, WhatsApp, financeiro, pagamentos Stripe e integração Almox Aqua. “Custos e materiais” permanece informativo. Lovable não foi utilizado: a implementação direta foi escolhida pelo usuário após constatarmos que o app não estava disponível na sessão.

## Executar

Requisitos: Node.js 22.13+ (Node 24 utilizado na validação), npm e um projeto Supabase para persistência real.

```bash
npm ci
cp .env.example .env.local
# Preencher .env.local com a configuração do seu projeto.
npm run dev
```

Para produção local:

```bash
npm run build
npm run start
```

O processo atende na porta 3000. Os processos precisam ser iniciados novamente em outra máquina; não são preservados em snapshots.

## Configurar Supabase

1. Crie um projeto Supabase. No SQL Editor, execute **integralmente** `supabase/migrations/202610310001_central.sql` uma vez em banco novo. Se usar CLI, vincule o projeto e aplique a migração pelo fluxo oficial. Não executar esta migração repetidamente como se fosse seed.
2. A migração cria as tabelas, funções, RLS e o bucket privado `condominium-private`, limitado a 10 MB e PDF/JPEG/PNG/WebP.
3. Configure no ambiente do servidor:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL HTTPS do projeto.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave **publicável**, apropriada para autenticação de usuários; nunca usar `service_role` aqui.
   - `APP_URL`: origem exata do aplicativo, incluindo protocolo e porta quando houver. Em desenvolvimento use `http://localhost:3000` e abra o app nessa mesma origem. Mutações de outra origem são bloqueadas.
4. Reinicie o servidor após alterar variáveis. Para uma compilação destinada à implantação, configure as variáveis antes do build e do startup.
5. Em Authentication → URL Configuration, configure Site URL e Redirect URLs com a origem do app e o caminho `/auth/confirm`. Para recuperação por token, configure o template oficial de e-mail com `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`. O callback também aceita o fluxo PKCE com `code`.
6. Crie a primeira conta em Authentication → Users, com senha definida de forma segura e e-mail confirmado. Esta versão não oferece cadastro público, envio de convite administrativo ou criação de contas por chave privilegiada dentro do app.
7. Entre com essa conta. O formulário de primeiro acesso cria **um novo condomínio** e o vínculo administrativo do criador. Conhecer um UUID de condomínio existente não permite ingressar nele.
8. Crie as demais contas pelo fluxo administrativo do Supabase, confirmando os e-mails. Em Configurações → Equipe, um administrador associa o UUID da conta, papel e permissões. Crie pelo menos uma segunda conta autorizada a decidir aprovações se ativar essa regra; o solicitante não aprova a própria publicação.
9. Cadastre blocos, unidades, pessoas e vínculos. Apenas vínculos explicitamente validados compõem a prévia de destinatários.

Não envie chaves privadas, senhas ou dados pessoais em chat. Use as configurações seguras do ambiente. Nenhuma chave administrativa é necessária para as operações comuns do aplicativo.

## Modelo e segurança

O modelo usa `records` como agregado tipado para os dez módulos operacionais, com `kind`, campos comuns e conteúdo JSONB validado pelas funções. `memberships` representa **acesso administrativo**, enquanto registros `unit_memberships` representam **vínculos de pessoas a unidades**. A separação evita exigir unidade para síndico/administrador. Esse modelo difere dos nomes ilustrativos do plano, preservando seus fluxos.

As tabelas auxiliares normalizadas são `record_versions`, `messages`, `approvals`, `recipients`, `announcement_events`, `attachments` e `audit_events`. RLS governa leitura; escritas diretas são revogadas e passam por funções transacionais com `auth.uid()`, associação ativa e permissão por ação. Referências são validadas no mesmo condomínio. Revisões esperadas impedem sobrescrita concorrente. Funções internas de snapshot/auditoria não são chamáveis pelo cliente.

Papéis são descritivos. Permissões concedem as ações; atribuir o nome “síndico” não concede edição automaticamente. Operadores consultam apenas os registros atribuídos, salvo concessão explícita `módulo.read_all`. Conceder acesso de escrita também exige conceder leitura. O gerenciamento de equipe não permite alterar o próprio acesso nem conceder permissões que o concedente não possui.

Anexos são preparados sob uma revisão, enviados ao bucket privado e confirmados antes de ficarem disponíveis. Edição cria um novo conjunto de arquivos; anexe novamente os arquivos da nova versão. Snapshots publicados preservam a lista anterior. URLs assinadas expiram em 60 segundos; uma URL já emitida permanece válida até expirar, mesmo se a permissão mudar nesse intervalo. Não há antivírus integrado nesta versão.

Mensagens externas são apenas registradas; não há canal de envio. `announcement_events` não aceita gravação por clientes. Não são fabricados eventos de entrega, abertura ou ciência. A quantidade de destinatários é de vínculos pessoa/unidade; uma pessoa em duas unidades produz dois vínculos.

## Validação

```bash
npm run typecheck
npm test
npm run build
# Com servidor rodando e Python Playwright instalado:
python3 scripts/smoke.py
```

`npm test` executa o runner nativo do Node diretamente para preservar os resultados dos subtestes junto ao runtime WASM do PGlite. A migração real é aplicada em Postgres embarcado com **stubs de identidade e storage**, papéis SQL e RLS reais. Testes incluem acesso entre condomínios, RPC/DML não autorizado, operador delegado, síndico sem edição, aprovações, dois vínculos por pessoa, snapshots, checklist independente, evidência, reabertura, arquivo privado e exportação.

Os testes de navegador verificam a interface real sem conexão e usam **fixtures isoladas de teste** para formulários e indicadores autenticados. Essas fixtures nunca são carregadas pelo aplicativo e não comprovam integração hospedada.

Antes do piloto, aplicar a migração em um Supabase real e testar login, recuperação, duas contas/condomínios, upload, expiração de URL, permissões via REST/RPC e todos os cenários de [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

## Limites conhecidos

- Sem projeto Supabase configurado, o fluxo persistente de produção não foi validado.
- Primeiras contas e convites dependem do painel/fluxo administrativo do Supabase; não há convite por e-mail gerenciado dentro da aplicação.
- Há limite explícito de 20 mil registros carregados por condomínio nesta versão. Ao excedê-lo a API falha de forma visível, evitando indicadores parciais. Uma etapa de escala deverá agregar no banco e paginar listas.
- Detalhes mostram até 100 versões e eventos recentes de auditoria e 500 mensagens. A auditoria administrativa mostra os 200 eventos mais recentes; dados anteriores permanecem no banco. A fila carrega até mil aprovações recentes. Ampliar/paginar antes de operar volumes maiores.
- Checklists são gerados manualmente uma vez por dia/modelo; não há agendamento externo. Evidências opcionais devem ser anexadas antes da conclusão da execução.
- Não há exclusão, arquivamento geral, busca global de auditoria, backup gerenciado pela aplicação ou notificações externas. O acesso pode ser revogado em Configurações por um administrador autorizado.
- Não há pagamento, dados de custo/estoque ou integração externa. Não é uma entrega de financeiro/portaria/reservas; o escopo é a primeira fase do plano fornecido.

As skills de frontend, React, Postgres, testes, Better Auth e Stripe foram instaladas no ambiente. Este projeto aplica Supabase Auth; instalar uma skill não instala o respectivo serviço nem obriga a usar duas soluções de autenticação.
