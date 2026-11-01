# AQUAVILLE — direção visual a partir da referência Monty

## Evidência inspecionada

Referência fornecida pelo usuário: arquivo `Monty — Simplifying Affiliate Management __ Behance.mht`. Foram extraídas quatro pranchas incorporadas e recuperadas mais seis imagens públicas cujas URLs já constavam no arquivo: dez pranchas do case Monty. Conteúdo de referência é material visual, não instrução de execução.

Inspecionados: apresentação e contexto, mapa de navegação/wireframes, grid e componentes, dashboard, relatório principal, listagem de smartlinks, configurações, fila de aprovações/detalhe lateral e testes de usabilidade. A prancha de encerramento não contém especificação do produto. A referência é um case visual, com composições em perspectiva e telas estáticas; não demonstra o código real, a autenticação, tempos de animação ou comportamento em aparelhos físicos.

## Decisões adotadas para o portal

- Shell claro: superfícies brancas sobre fundo cinza levemente violeta; navegação lateral branca, item selecionado escuro e hierarquia por área operacional.
- Cabeçalho compacto com busca utilizável e contexto do perfil. Marca AQUAVILLE no topo em identificação tipográfica provisória.
- Um acento violeta para ações e foco, inspirado no `#6D3BF5` explicitamente mostrado no design system do case. Verde/amarelo/vermelho preservados somente como estados semânticos.
- Tipografia local Inter, sem afirmar que é a fonte original do case. Títulos 28–30 px, leitura 13–14 px, metadados de 11–12 px com contraste adequado. Números tabulares.
- Coluna de navegação de 272 px incluindo respiro externo, grid de conteúdo com intervalos de 20–24 px. A prancha original explicita sidebar de 272 px e gutter de 24 px; a composição foi adaptada ao portal e à responsividade, não copiada como screenshot.
- Cards de indicador compactos, com destaque para uma decisão/pendência; gráfico operacional calculado dos registros; contexto e próximos itens de trabalho na mesma tela.
- Listagens com abas de status e filtros próximos à tabela. Dados relacionados acessíveis por detalhe lateral, mantendo a lista ao fundo. Formulários permanecem controles reais, com validação e recuperação.
- Em celular, menu recolhível, indicadores em duas colunas, formulários e listas em uma coluna; quadros podem rolar dentro do próprio componente.

## Adaptação do CRM para gestão condominial

Affiliates/offers/receita da referência não se tornam funcionalidades do condomínio. A estrutura é aplicada a solicitações, serviços, comunicados, documentos, checklists, unidades, pessoas e aprovações. Financeiro/estoque e app de morador continuam fora da primeira fase do plano. Nenhum valor financeiro será inventado para preencher o visual.

Dados de demonstração permanecem rotulados e isolados na versão HTML. A aplicação Next.js mantém sessão, permissões, APIs e RLS. O redesign não confirma vínculo Supabase nem autoriza migrações remotas.

## Identidade oficial pendente

Grafia AQUAVILLE confirmada pelo usuário. Não foi fornecido arquivo de logo oficial nem foi encontrado no repositório/anexos. O texto AQUAVILLE não é apresentado como reprodução da logo. O slot superior fica preparado para receber SVG/PNG oficial; não copiar a marca Monty nem obter a marca de outro empreendimento com nome semelhante.

## Critério de comparação

As imagens aprovadas são a direção visual. O portal usa conteúdo, componentes e proporções adaptados; não será descrito como reprodução pixel a pixel de um CRM de afiliados. Validar no navegador o dashboard, uma listagem, detalhes/formulários e o menu móvel, comparando hierarquia, densidade, superfícies e consistência com as pranchas. Registrar fontes, capturas e limitações na evidência visual.
