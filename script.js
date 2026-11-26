// lista de gastos salva no navegador
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

// data de hoje no horario local (formato "2026-11-25")
const agora = new Date();
const hoje = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, "0"),
  String(agora.getDate()).padStart(2, "0"),
].join("-");

// gastos antigos (da primeira versao) nao tinham categoria nem data
gastos = gastos.map((gasto) => ({
  nome: gasto.nome,
  valor: gasto.valor,
  categoria: gasto.categoria || "Outros",
  data: gasto.data || hoje,
}));

// mes que esta sendo exibido (formato "2026-11")
const campoMes = document.getElementById("mes");
campoMes.value = hoje.slice(0, 7);
document.getElementById("data").value = hoje;

// formata numero como dinheiro: 1234.5 -> "R$ 1.234,50"
function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// formata data: "2026-11-25" -> "25/11"
function diaMes(data) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

// função pra adicionar gasto
function adicionarGasto(evento) {
  evento.preventDefault();

  // pegando valores do formulario
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

  // adiciona na lista e mostra o mes do gasto
  gastos.push({ nome, valor, categoria, data });
  campoMes.value = data.slice(0, 7);

  salvar();
  atualizarTela();

  // limpa os campos
  document.getElementById("nome").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("nome").focus();
}

// remove um gasto
function removerGasto(index) {
  gastos.splice(index, 1);
  salvar();
  atualizarTela();
}

// salva no localStorage
function salvar() {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

// atualiza lista, resumo e grafico
function atualizarTela() {
  const mes = campoMes.value;

  // so os gastos do mes escolhido, do mais novo pro mais antigo
  const doMes = gastos
    .map((gasto, index) => ({ ...gasto, index }))
    .filter((gasto) => gasto.data.startsWith(mes))
    .sort((a, b) => b.data.localeCompare(a.data));

  // lista
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  doMes.forEach((gasto) => {
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
    remover.textContent = "×";
    remover.onclick = () => removerGasto(gasto.index);

    li.append(data, nome, categoria, valor, remover);
    lista.appendChild(li);
  });

  document.getElementById("vazio").style.display = doMes.length ? "none" : "block";

  // soma por categoria
  const porCategoria = {};
  let total = 0;
  doMes.forEach((gasto) => {
    total += gasto.valor;
    porCategoria[gasto.categoria] = (porCategoria[gasto.categoria] || 0) + gasto.valor;
  });

  // ordena da maior pra menor
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  // resumo
  document.getElementById("total").textContent = dinheiro(total);
  document.getElementById("quantidade").textContent = doMes.length;
  document.getElementById("maiorCategoria").textContent = categorias.length ? categorias[0][0] : "—";

  // grafico de barras feito so com HTML e CSS
  const grafico = document.getElementById("grafico");
  grafico.innerHTML = "";

  if (!categorias.length) {
    grafico.innerHTML = '<p class="dica">O gráfico aparece quando houver gastos no mês.</p>';
    return;
  }

  const maior = categorias[0][1];
  categorias.forEach(([nome, valor]) => {
    const linha = document.createElement("div");
    linha.className = "barra-linha";

    const topo = document.createElement("div");
    topo.className = "barra-topo";
    const rotulo = document.createElement("span");
    rotulo.textContent = nome;
    const numeros = document.createElement("span");
    numeros.textContent = `${dinheiro(valor)} · ${Math.round((valor / total) * 100)}%`;
    topo.append(rotulo, numeros);

    const trilho = document.createElement("div");
    trilho.className = "barra-trilho";
    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.width = `${(valor / maior) * 100}%`;
    trilho.appendChild(barra);

    linha.append(topo, trilho);
    grafico.appendChild(linha);
  });
}

// dados de exemplo pra quem quer so ver como funciona
function carregarExemplo() {
  const mes = campoMes.value;
  const exemplo = [
    ["02", "Aluguel", 1200, "Contas"],
    ["03", "Conta de luz", 186.4, "Contas"],
    ["05", "Mercado do mês", 642.9, "Mercado"],
    ["07", "Combustível", 230, "Transporte"],
    ["09", "Farmácia", 58.75, "Saúde"],
    ["12", "Almoço no trabalho", 42, "Alimentação"],
    ["14", "Internet", 99.9, "Contas"],
    ["16", "Cinema", 64, "Lazer"],
    ["18", "Feira", 87.3, "Mercado"],
    ["21", "Uber", 31.5, "Transporte"],
    ["23", "Pizza", 79, "Alimentação"],
  ];
  exemplo.forEach(([dia, nome, valor, categoria]) => {
    gastos.push({ nome, valor, categoria, data: `${mes}-${dia}` });
  });
  salvar();
  atualizarTela();
}

// eventos
document.getElementById("form").addEventListener("submit", adicionarGasto);
document.getElementById("exemplo").addEventListener("click", carregarExemplo);
campoMes.addEventListener("change", atualizarTela);

// inicia tela (?exemplo na url ja abre com os dados de exemplo)
if (new URLSearchParams(location.search).has("exemplo") && gastos.length === 0) {
  carregarExemplo();
} else {
  atualizarTela();
}
