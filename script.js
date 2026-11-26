// ===================== dados =====================

// le e grava no navegador (se o navegador bloquear, funciona so na memoria)
function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem localStorage: os dados ficam so enquanto a pagina estiver aberta
  }
}

// lista de gastos e limite do mes salvos no navegador
let gastos = JSON.parse(ler("gastos")) || [];
let limite = Number(ler("limite")) || 0;

// categoria clicada no grafico (null = mostra todas)
let categoriaFiltro = null;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// data no formato "2026-11-25", sempre no horario local
function formatarData(data) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

const hoje = formatarData(new Date());

// gastos antigos (da primeira versao) nao tinham categoria nem data
gastos = gastos.map((gasto) => ({
  nome: gasto.nome,
  valor: gasto.valor,
  categoria: gasto.categoria || "Outros",
  data: gasto.data || hoje,
}));

const campoMes = document.getElementById("mes");
campoMes.value = hoje.slice(0, 7);
document.getElementById("data").value = hoje;


// ===================== funcoes de apoio =====================

// 1234.5 -> "R$ 1.234,50"
function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 1000 -> "R$ 1.000" (sem centavos, pro eixo do grafico)
function dinheiroCurto(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

// "2026-11-25" -> "25/11"
function diaMes(data) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

// "2026-11" + (-1) -> "2026-10"
function mudarMes(mes, quantos) {
  const [ano, numero] = mes.split("-").map(Number);
  return formatarData(new Date(ano, numero - 1 + quantos, 1)).slice(0, 7);
}

// "2026-11" -> "novembro"
function nomeDoMes(mes) {
  return MESES[Number(mes.slice(5, 7)) - 1];
}

// "2026-02" -> 28
function diasNoMes(mes) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(ano, numero, 0).getDate();
}

// gastos de um mes, guardando a posicao original (pra poder remover)
function gastosDoMes(mes) {
  return gastos
    .map((gasto, index) => ({ ...gasto, index }))
    .filter((gasto) => gasto.data.startsWith(mes));
}

function somar(lista) {
  return lista.reduce((total, gasto) => total + gasto.valor, 0);
}

// soma por categoria, da maior pra menor: [["Contas", 1486.3], ...]
function somarPorCategoria(lista) {
  const soma = {};
  lista.forEach((gasto) => {
    soma[gasto.categoria] = (soma[gasto.categoria] || 0) + gasto.valor;
  });
  return Object.entries(soma).sort((a, b) => b[1] - a[1]);
}

function salvar() {
  gravar("gastos", JSON.stringify(gastos));
}


// ===================== acoes do usuario =====================

function adicionarGasto(evento) {
  evento.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const data = document.getElementById("data").value || hoje;

  // validação simples
  const erro = document.getElementById("erro");
  if (!nome || isNaN(valor) || valor <= 0) {
    erro.textContent = "Preencha a descrição e um valor maior que zero.";
    return;
  }
  erro.textContent = "";

  gastos.push({ nome, valor, categoria, data });
  campoMes.value = data.slice(0, 7);
  salvar();
  atualizarTela();

  // limpa os campos pro proximo gasto
  document.getElementById("nome").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("nome").focus();
}

function removerGasto(index) {
  gastos.splice(index, 1);
  salvar();
  atualizarTela();
}

function salvarLimite(evento) {
  evento.preventDefault();
  limite = parseFloat(document.getElementById("campoLimite").value) || 0;
  gravar("limite", limite);
  document.getElementById("formLimite").hidden = true;
  atualizarTela();
}

// baixa os gastos do mes num arquivo que abre no Excel
function exportarCsv() {
  const mes = campoMes.value;
  const linhas = [["Data", "Descrição", "Categoria", "Valor"]];

  gastosDoMes(mes)
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach((gasto) => {
      linhas.push([
        gasto.data.split("-").reverse().join("/"),
        gasto.nome,
        gasto.categoria,
        gasto.valor.toFixed(2).replace(".", ","),
      ]);
    });

  const csv = linhas
    .map((linha) => linha.map((celula) => `"${String(celula).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  // o ﻿ no comeco faz o Excel entender os acentos
  const arquivo = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = `gastos-${mes}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}


// ===================== tela =====================

function atualizarTela() {
  if (!campoMes.value) campoMes.value = hoje.slice(0, 7);
  const mes = campoMes.value;

  // do mais novo pro mais antigo
  const doMes = gastosDoMes(mes).sort((a, b) => b.data.localeCompare(a.data));
  const total = somar(doMes);
  const categorias = somarPorCategoria(doMes);

  // se a categoria filtrada nao existe neste mes, tira o filtro
  if (categoriaFiltro && !categorias.some(([nome]) => nome === categoriaFiltro)) {
    categoriaFiltro = null;
  }

  atualizarResumo(mes, doMes, total, categorias);
  desenharGraficoDias(mes, doMes);
  desenharGraficoCategorias(categorias, total);
  desenharLista(doMes);
}

function atualizarResumo(mes, doMes, total, categorias) {
  // total e comparacao com o mes anterior
  document.getElementById("total").textContent = dinheiro(total);

  const anterior = somar(gastosDoMes(mudarMes(mes, -1)));
  const variacao = document.getElementById("variacao");
  variacao.className = "nota";

  if (anterior > 0 && total > 0) {
    const porcento = Math.round(((total - anterior) / anterior) * 100);
    const nomeAnterior = nomeDoMes(mudarMes(mes, -1));
    if (porcento > 0) {
      variacao.textContent = `▲ ${porcento}% a mais que ${nomeAnterior}`;
      variacao.classList.add("pior");
    } else if (porcento < 0) {
      variacao.textContent = `▼ ${Math.abs(porcento)}% a menos que ${nomeAnterior}`;
      variacao.classList.add("melhor");
    } else {
      variacao.textContent = `Igual a ${nomeAnterior}`;
    }
  } else {
    variacao.textContent = "";
  }

  // limite do mes
  const trilho = document.getElementById("medidorTrilho");
  const medidor = document.getElementById("medidor");
  const restante = document.getElementById("restante");
  restante.className = "nota";

  if (limite > 0) {
    const usado = total / limite;
    document.getElementById("limite").textContent = dinheiro(limite);
    document.getElementById("editarLimite").textContent = "alterar";
    trilho.hidden = false;
    medidor.style.width = `${Math.min(usado, 1) * 100}%`;
    medidor.className = "medidor-barra";

    if (total > limite) {
      medidor.classList.add("estourou");
      restante.classList.add("pior");
      restante.textContent = `Passou ${dinheiro(total - limite)} do limite`;
    } else {
      if (usado >= 0.8) medidor.classList.add("atencao");
      restante.textContent = `${Math.round(usado * 100)}% usado · restam ${dinheiro(limite - total)}`;
    }
  } else {
    document.getElementById("limite").textContent = "—";
    trilho.hidden = true;
    restante.textContent = "Defina um valor para acompanhar.";
  }

  // maior categoria
  if (categorias.length) {
    document.getElementById("maiorCategoria").textContent = categorias[0][0];
    document.getElementById("maiorParte").textContent =
      `${Math.round((categorias[0][1] / total) * 100)}% do mês`;
  } else {
    document.getElementById("maiorCategoria").textContent = "—";
    document.getElementById("maiorParte").textContent = "";
  }

  // media por dia (no mes atual, conta so ate hoje)
  const dias = mes === hoje.slice(0, 7) ? Number(hoje.slice(8, 10)) : diasNoMes(mes);
  document.getElementById("media").textContent = dinheiro(total / dias);
  document.getElementById("quantidade").textContent =
    `${doMes.length} ${doMes.length === 1 ? "gasto lançado" : "gastos lançados"}`;
}

function desenharLista(doMes) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const visiveis = categoriaFiltro
    ? doMes.filter((gasto) => gasto.categoria === categoriaFiltro)
    : doMes;

  visiveis.forEach((gasto) => {
    const li = document.createElement("li");

    const data = document.createElement("span");
    data.className = "data";
    data.textContent = diaMes(gasto.data);

    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = gasto.nome;

    const categoria = document.createElement("span");
    categoria.className = "etiqueta";
    categoria.textContent = gasto.categoria;

    const valor = document.createElement("span");
    valor.className = "valor";
    valor.textContent = dinheiro(gasto.valor);

    const remover = document.createElement("button");
    remover.className = "remover";
    remover.title = "Remover";
    remover.setAttribute("aria-label", `Remover ${gasto.nome}`);
    remover.textContent = "×";
    remover.onclick = () => removerGasto(gasto.index);

    li.append(data, nome, categoria, valor, remover);
    lista.appendChild(li);
  });

  document.getElementById("vazio").style.display = doMes.length ? "none" : "block";

  // aviso do filtro
  document.getElementById("filtro").hidden = !categoriaFiltro;
  document.getElementById("filtroNome").textContent = categoriaFiltro ? `Só ${categoriaFiltro}` : "";
}


// ===================== grafico por categoria =====================

function desenharGraficoCategorias(categorias, total) {
  const grafico = document.getElementById("grafico");
  grafico.innerHTML = "";

  if (!categorias.length) {
    grafico.innerHTML = '<p class="dica">O gráfico aparece quando houver gastos no mês.</p>';
    return;
  }

  const maior = categorias[0][1];

  categorias.forEach(([nome, valor]) => {
    // cada linha é um botao: clicar filtra a lista por essa categoria
    const linha = document.createElement("button");
    linha.type = "button";
    linha.className = "barra-linha";
    linha.setAttribute("aria-pressed", categoriaFiltro === nome);
    if (categoriaFiltro && categoriaFiltro !== nome) linha.classList.add("apagada");
    linha.onclick = () => {
      categoriaFiltro = categoriaFiltro === nome ? null : nome;
      atualizarTela();
    };

    const topo = document.createElement("span");
    topo.className = "barra-topo";
    const rotulo = document.createElement("span");
    rotulo.textContent = nome;
    const numeros = document.createElement("span");
    numeros.textContent = `${dinheiro(valor)} · ${Math.round((valor / total) * 100)}%`;
    topo.append(rotulo, numeros);

    const trilho = document.createElement("span");
    trilho.className = "barra-trilho";
    const barra = document.createElement("span");
    barra.className = "barra";
    barra.style.width = `${(valor / maior) * 100}%`;
    trilho.appendChild(barra);

    linha.append(topo, trilho);
    grafico.appendChild(linha);
  });
}


// ===================== grafico de gastos por dia (SVG) =====================

const SVG = "http://www.w3.org/2000/svg";

function criarSvg(tag, atributos) {
  const elemento = document.createElementNS(SVG, tag);
  Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, valor));
  return elemento;
}

// escolhe um passo "redondo" pro eixo (100, 200, 250, 500, 1.000...)
// pra caber o maior valor em ate 4 linhas: 1200 -> passo 500, topo 1500
function passoRedondo(maior) {
  const bruto = maior / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  for (const passo of [1, 2, 2.5, 5, 10]) {
    if (passo * potencia >= bruto) return passo * potencia;
  }
  return 10 * potencia;
}

// coluna com o topo arredondado e a base reta
function caminhoColuna(x, y, largura, altura, raio) {
  const r = Math.min(raio, largura / 2, altura);
  return `M${x},${y + altura} V${y + r} Q${x},${y} ${x + r},${y} ` +
    `H${x + largura - r} Q${x + largura},${y} ${x + largura},${y + r} V${y + altura} Z`;
}

function desenharGraficoDias(mes, doMes) {
  const caixa = document.getElementById("graficoDias");
  const legenda = document.getElementById("diaMaior");
  caixa.innerHTML = "";
  legenda.textContent = "";

  // soma de cada dia do mes
  const dias = diasNoMes(mes);
  const porDia = Array.from({ length: dias }, () => ({ total: 0, nomes: [] }));
  doMes.forEach((gasto) => {
    const dia = Number(gasto.data.slice(8, 10));
    porDia[dia - 1].total += gasto.valor;
    porDia[dia - 1].nomes.push(gasto.nome);
  });

  const maior = Math.max(...porDia.map((dia) => dia.total));
  if (maior === 0) {
    caixa.innerHTML = '<p class="dica">O gráfico aparece quando houver gastos no mês.</p>';
    return;
  }

  const diaDoMaior = porDia.findIndex((dia) => dia.total === maior) + 1;
  legenda.textContent = `Maior dia: ${String(diaDoMaior).padStart(2, "0")}/${mes.slice(5)} · ${dinheiro(maior)}`;

  // medidas do desenho
  const largura = caixa.clientWidth || 860;
  const altura = 200;
  const margem = { topo: 22, direita: 4, baixo: 24, esquerda: 62 };
  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.topo - margem.baixo;
  const base = margem.topo + areaAltura;
  const passo = passoRedondo(maior);
  const linhas = Math.ceil(maior / passo);
  const topo = passo * linhas;
  const faixa = areaLargura / dias;
  const grossura = Math.min(24, faixa * 0.6);

  const svg = criarSvg("svg", {
    width: largura,
    height: altura,
    viewBox: `0 0 ${largura} ${altura}`,
    role: "img",
    "aria-label": `Gastos por dia em ${nomeDoMes(mes)}`,
  });

  // linhas de grade e valores do eixo
  for (let i = 0; i <= linhas; i++) {
    const valor = passo * i;
    const y = base - (valor / topo) * areaAltura;
    svg.appendChild(criarSvg("line", {
      x1: margem.esquerda, x2: largura - margem.direita, y1: y, y2: y,
      class: i === 0 ? "eixo" : "grade",
    }));
    const texto = criarSvg("text", { x: margem.esquerda - 8, y: y + 4, "text-anchor": "end", class: "texto-eixo" });
    texto.textContent = dinheiroCurto(valor);
    svg.appendChild(texto);
  }

  porDia.forEach((dia, i) => {
    const numero = i + 1;
    const x = margem.esquerda + i * faixa;
    const centro = x + faixa / 2;

    // dias 1, 5, 10, 15... embaixo do grafico
    if (numero === 1 || numero % 5 === 0) {
      const texto = criarSvg("text", { x: centro, y: altura - 6, "text-anchor": "middle", class: "texto-eixo" });
      texto.textContent = numero;
      svg.appendChild(texto);
    }

    if (dia.total === 0) return;

    const alturaColuna = Math.max(2, (dia.total / topo) * areaAltura);
    const coluna = criarSvg("path", {
      d: caminhoColuna(centro - grossura / 2, base - alturaColuna, grossura, alturaColuna, 4),
      class: "coluna",
    });
    svg.appendChild(coluna);

    // valor escrito so em cima da maior coluna
    if (numero === diaDoMaior) {
      const perto = Math.min(centro, largura - 34);
      const texto = criarSvg("text", { x: perto, y: base - alturaColuna - 6, "text-anchor": "middle", class: "texto-valor" });
      texto.textContent = dinheiroCurto(dia.total);
      svg.appendChild(texto);
    }

    // area de toque maior que a coluna (mouse e teclado)
    const alvo = criarSvg("rect", {
      x, y: margem.topo, width: faixa, height: areaAltura,
      class: "alvo", tabindex: 0,
      "aria-label": `${numero}/${mes.slice(5)}: ${dinheiro(dia.total)}`,
    });
    const titulo = `${String(numero).padStart(2, "0")}/${mes.slice(5)}`;
    const mostrar = (evento) => {
      coluna.classList.add("ativa");
      mostrarDica(evento, titulo, dia);
    };
    const esconder = () => {
      coluna.classList.remove("ativa");
      esconderDica();
    };
    alvo.addEventListener("pointermove", mostrar);
    alvo.addEventListener("pointerleave", esconder);
    alvo.addEventListener("focus", mostrar);
    alvo.addEventListener("blur", esconder);
    svg.appendChild(alvo);
  });

  caixa.appendChild(svg);
}

// caixinha com o valor do dia
const dica = document.getElementById("tooltip");

function mostrarDica(evento, titulo, dia) {
  dica.innerHTML = "";
  const valor = document.createElement("strong");
  valor.textContent = dinheiro(dia.total);
  const data = document.createElement("span");
  data.textContent = titulo;
  const nomes = document.createElement("span");
  nomes.className = "nomes";
  nomes.textContent = dia.nomes.join(", ");
  dica.append(valor, data, nomes);
  dica.hidden = false;

  // perto do mouse; no teclado, em cima da coluna
  let x;
  let y;
  if (evento.type === "focus") {
    const caixa = evento.target.getBoundingClientRect();
    x = caixa.left + caixa.width / 2;
    y = caixa.top + caixa.height / 2;
  } else {
    x = evento.clientX;
    y = evento.clientY;
  }
  dica.style.left = `${Math.min(window.innerWidth - dica.offsetWidth - 8, x + 14)}px`;
  dica.style.top = `${Math.max(8, y - dica.offsetHeight - 12)}px`;
}

function esconderDica() {
  dica.hidden = true;
}


// ===================== dados de exemplo =====================

// pra quem quer so ver como funciona
function carregarExemplo() {
  const mes = campoMes.value;
  const anterior = mudarMes(mes, -1);
  const exemplo = [
    [mes, "02", "Aluguel", 1200, "Contas"],
    [mes, "03", "Conta de luz", 186.4, "Contas"],
    [mes, "05", "Mercado do mês", 642.9, "Mercado"],
    [mes, "07", "Combustível", 230, "Transporte"],
    [mes, "09", "Farmácia", 58.75, "Saúde"],
    [mes, "12", "Almoço no trabalho", 42, "Alimentação"],
    [mes, "14", "Internet", 99.9, "Contas"],
    [mes, "16", "Cinema", 64, "Lazer"],
    [mes, "18", "Feira", 87.3, "Mercado"],
    [mes, "21", "Uber", 31.5, "Transporte"],
    [mes, "23", "Pizza", 79, "Alimentação"],
    [anterior, "02", "Aluguel", 1200, "Contas"],
    [anterior, "04", "Conta de luz", 171.2, "Contas"],
    [anterior, "06", "Mercado do mês", 598.4, "Mercado"],
    [anterior, "10", "Combustível", 210, "Transporte"],
    [anterior, "15", "Internet", 99.9, "Contas"],
    [anterior, "19", "Restaurante", 96, "Alimentação"],
    [anterior, "25", "Feira", 62.5, "Mercado"],
  ];
  exemplo.forEach(([mesDoGasto, dia, nome, valor, categoria]) => {
    gastos.push({ nome, valor, categoria, data: `${mesDoGasto}-${dia}` });
  });

  if (!limite) {
    limite = 3000;
    gravar("limite", limite);
  }

  salvar();
  atualizarTela();
}


// ===================== eventos =====================

document.getElementById("form").addEventListener("submit", adicionarGasto);
document.getElementById("formLimite").addEventListener("submit", salvarLimite);
document.getElementById("exemplo").addEventListener("click", carregarExemplo);
document.getElementById("exportar").addEventListener("click", exportarCsv);
campoMes.addEventListener("change", atualizarTela);

document.getElementById("editarLimite").addEventListener("click", () => {
  const form = document.getElementById("formLimite");
  form.hidden = !form.hidden;
  document.getElementById("campoLimite").value = limite || "";
  if (!form.hidden) document.getElementById("campoLimite").focus();
});

document.getElementById("limparFiltro").addEventListener("click", () => {
  categoriaFiltro = null;
  atualizarTela();
});

document.getElementById("mesAnterior").addEventListener("click", () => {
  campoMes.value = mudarMes(campoMes.value, -1);
  atualizarTela();
});

document.getElementById("mesSeguinte").addEventListener("click", () => {
  campoMes.value = mudarMes(campoMes.value, 1);
  atualizarTela();
});

// redesenha o grafico quando a janela muda de tamanho
let esperaRedimensionar;
window.addEventListener("resize", () => {
  clearTimeout(esperaRedimensionar);
  esperaRedimensionar = setTimeout(atualizarTela, 150);
});

// inicia tela (?exemplo na url ja abre com os dados de exemplo)
if (new URLSearchParams(location.search).has("exemplo") && gastos.length === 0) {
  carregarExemplo();
} else {
  atualizarTela();
}
