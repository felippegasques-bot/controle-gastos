# Controle de Gastos

Aplicação web para anotar os gastos do dia a dia e ver, mês a mês, para onde o dinheiro está indo.

**[Ver online](https://felippegasques-bot.github.io/controle-gastos/)** · para abrir já com dados de exemplo: [?exemplo](https://felippegasques-bot.github.io/controle-gastos/?exemplo)

![Tela do Controle de Gastos com gastos de exemplo](preview.png)

## O que faz

- Lança gastos com descrição, valor, categoria e data
- Navega mês a mês e compara o total com o mês anterior
- Limite do mês: uma barra mostra quanto já foi usado e quanto ainda resta
- Gráfico de gastos por dia, desenhado em SVG à mão, com o valor de cada dia ao passar o mouse
- Gráfico por categoria: clicar numa categoria filtra a lista
- Exporta os gastos do mês em CSV (abre no Excel)
- Guarda tudo no próprio navegador (localStorage), sem servidor
- Funciona no celular

## Como rodar

Não precisa instalar nada: baixe o repositório e abra o `index.html` no navegador.

## Tecnologias

JavaScript puro (sem bibliotecas), HTML e CSS.

## O que pratiquei

- Criar a lista com `createElement` e `textContent`, e não com `innerHTML`, para o texto digitado nunca virar código na página
- Filtrar, ordenar e agrupar dados por mês, por dia e por categoria
- Desenhar um gráfico em SVG sem biblioteca: escala do eixo, colunas e área de toque para mouse e teclado
- Trabalhar com datas no horário local (usar `toISOString` mostrava o dia seguinte à noite)
- Layout com CSS Grid que se adapta ao celular
- Manter os gastos salvos na primeira versão funcionando depois da mudança no formato dos dados

## Versões

- **v2:** categorias, datas, navegação por mês, limite do mês, gráficos por dia e por categoria, exportação em CSV
- **v1 (mar/2026):** lista simples com o total

Existe também uma versão com back-end em Python: [smart-budget](https://github.com/felippegasques-bot/smart-budget).
