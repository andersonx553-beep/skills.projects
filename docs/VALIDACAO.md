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
