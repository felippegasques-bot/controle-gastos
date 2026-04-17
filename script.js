// lista de gastos salva no navegador
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

// função pra adicionar gasto
function adicionarGasto() {
  // pegando valores do input
  const nome = document.getElementById("nome").value;
  const valor = parseFloat(document.getElementById("valor").value);

  // validação simples
  if (!nome || isNaN(valor)) {
    alert("Preencha os campos corretamente!");
    return;
  }

  // criando objeto do gasto
  const gasto = { nome, valor };

  // adiciona na lista
  gastos.push(gasto);

  // salva e atualiza tela
  salvar();
  atualizarTela();

  // limpa os inputs
  document.getElementById("nome").value = "";
  document.getElementById("valor").value = "";
}

// atualiza lista na tela
function atualizarTela() {
  const lista = document.getElementById("lista");
  const totalSpan = document.getElementById("total");

  lista.innerHTML = "";

  let total = 0;

  // percorre os gastos
  gastos.forEach((gasto, index) => {
    total += gasto.valor;

    const li = document.createElement("li");

    // cria item com botão de remover
    li.innerHTML = `
      ${gasto.nome} - R$ ${gasto.valor.toFixed(2)}
      <button onclick="removerGasto(${index})">X</button>
    `;

    lista.appendChild(li);
  });

  // atualiza total
  totalSpan.innerText = total.toFixed(2);
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

// inicia tela
atualizarTela();
