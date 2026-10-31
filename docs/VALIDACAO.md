# Registro de validação — 31/10/2026

## Executado nesta máquina

- `npm ci`: instalação reproduzível pelo lockfile passou.
- `npm run typecheck`: passou.
- `npm test`: 24 testes passaram, nenhum falhou ou foi ignorado. Inclui a migração em PGlite, papéis SQL, RLS, isolamento entre condomínios, autorização de ações, versões, aprovações, serviços, checklists, storage simulado, revogação e filtros.
- `npm run build`: compilação de produção passou, com nove rotas de aplicação/API e callback de autenticação.
- `npm run start`: servidor de produção iniciado e validado por requisição de saúde.
- `python3 scripts/smoke.py`: 12 verificações passaram. Navegação de todos os módulos, estado sem conexão, login bloqueado sem configuração, integração futura, rejeição de origem indevida, layout em 390 px e fluxos de interface autenticada com fixtures isoladas.
- `npx prettier --check src tests package.json tsconfig.json next.config.ts`: passou.

O uso de PGlite exercita SQL e RLS, mas os schemas Auth e Storage são stubs de teste. A interface autenticada é exercitada com respostas HTTP de teste, identificadas como demonstração. Não há seeds fictícios no aplicativo ou na migração.

## Não executado

Não havia bindings nem variáveis Supabase neste ambiente. Login real, recuperação por e-mail, aplicação da migração em Supabase hospedado, uploads reais, URLs assinadas e isolamento via REST/RPC hospedado precisam ser validados no projeto do usuário. Nenhuma publicação foi realizada. Lovable não foi utilizado.

## Configuração persistida

O rascunho do ambiente contém `install_script`, `start_skill` e os requisitos de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `APP_URL`. O salvamento foi confirmado. Ele não configura automaticamente o banco, não preenche chaves, não executa scripts e não publica o ambiente. Revisar e salvar nas configurações e publicar o ambiente quando a configuração estiver concluída.

## Capturas locais

Geradas pelo teste de navegador em `/tmp/central-condominio-qa/desktop.png` e `/tmp/central-condominio-qa/mobile.png`. Mostram o aplicativo sem banco conectado, sem indicadores fabricados.

## Complemento: versão HTML e CLI Supabase

Foi adicionada uma demonstração HTML estática em `index.html`, `assets/central.css` e `assets/central.js`, com todas as áreas visíveis e operações fictícias em memória. Ela é independente da aplicação Next.js e não envia solicitações ao Supabase. A suíte `scripts/smoke_html.py` verifica navegação de todas as áreas, formulários, serviço vinculado, conclusão/reabertura, aprovação por outro perfil, documento com PDF local, checklist, exportação e layout móvel. As capturas ficam em `/tmp/central-html-qa/`.

A abertura direta por `file://` foi bloqueada por política administrativa do navegador do ambiente. Esse cenário não foi validado; não houve tentativa de contornar a política. A mesma pasta foi validada pelo servidor HTTP estático na porta 4173.

`supabase init` e `supabase migration new new-migration` foram executados. A migração adicional contém apenas comentários e não duplica o schema. `supabase link --project-ref jqdronfvtezjywarcphb` retornou `AccessTokenRequiredError`; `db push` não foi executado. O requisito `SUPABASE_ACCESS_TOKEN` foi salvo no rascunho seguro e adicionou o destino HTTPS `api.supabase.com`. A URL pública padrão do projeto foi salva como sugestão para `NEXT_PUBLIC_SUPABASE_URL`; isso não confirma conexão nem aplicação no runtime.
