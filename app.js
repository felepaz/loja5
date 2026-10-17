let carrinho = [];
try { carrinho = JSON.parse(localStorage.getItem("carrinho")) || []; } catch (e) { carrinho = []; }

const $ = (id) => document.getElementById(id);
const dinheiro = (v) => "R$ " + v.toFixed(2).replace(".", ",");
const salvar = () => { try { localStorage.setItem("carrinho", JSON.stringify(carrinho)); } catch (e) {} };

// ===== CARREGAMENTO INTELIGENTE DE FOTOS =====
// Procura a foto na raiz e em pastas comuns, com várias extensões.
const PASTAS = ["", "images/", "imagens/", "fotos/"];
const EXTS = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];
const SEM_FOTO = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#ddd"/>' +
  '<text x="50%" y="50%" text-anchor="middle" fill="#888" font-family="Arial" font-size="22">Sem foto</text></svg>');

function candidatos(base) {
  const lista = [];
  const temExt = /\.[a-zA-Z0-9]{3,4}$/.test(base);
  PASTAS.forEach(p => {
    if (temExt) lista.push(p + base);
    else EXTS.forEach(e => lista.push(p + base + e));
  });
  return lista;
}

function carregarFoto(base, img, aoFalhar) {
  const lista = candidatos(base);
  let i = 0;
  (function tentar() {
    if (i >= lista.length) { if (aoFalhar) aoFalhar(); return; }
    const teste = new Image();
    const atual = lista[i];
    teste.onload = () => { img.src = atual; img.style.display = ""; };
    teste.onerror = () => { i++; tentar(); };
    teste.src = atual;
  })();
}

// ===== LOJA =====
$("nomeLoja").textContent = CONFIG.nomeLoja;
$("ano").textContent = new Date().getFullYear();
carregarFoto(CONFIG.logo, $("logo"), () => { $("logo").style.display = "none"; });

function mostrarProdutos() {
  $("lista").innerHTML = PRODUTOS.map(p => `
    <article class="card">
      <img data-foto="${p.foto}" src="${SEM_FOTO}" alt="${p.nome}">
      <div class="info">
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <div class="preco">${dinheiro(p.preco)}</div>
        <button class="btn-add" onclick="adicionar(${p.id})">Adicionar ao carrinho</button>
      </div>
    </article>`).join("");
  document.querySelectorAll("img[data-foto]").forEach(img => carregarFoto(img.dataset.foto, img));
}

function adicionar(id) {
  const existente = carrinho.find(i => i.id === id);
  if (existente) existente.qtd++;
  else carrinho.push({ id, qtd: 1 });
  salvar(); atualizar(); abrir();
}

function mudarQtd(id, delta) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) carrinho = carrinho.filter(i => i.id !== id);
  salvar(); atualizar();
}

function remover(id) {
  carrinho = carrinho.filter(i => i.id !== id);
  salvar(); atualizar();
}

function atualizar() {
  let total = 0, qtdTotal = 0;
  const html = carrinho.map(i => {
    const p = PRODUTOS.find(x => x.id === i.id);
    if (!p) return "";
    total += p.preco * i.qtd;
    qtdTotal += i.qtd;
    return `<div class="item">
      <div>
        <strong>${p.nome}</strong>
        <div class="qtd">
          <button onclick="mudarQtd(${p.id}, -1)">-</button>
          <span>${i.qtd}</span>
          <button onclick="mudarQtd(${p.id}, 1)">+</button>
          <button class="remover" onclick="remover(${p.id})">remover</button>
        </div>
      </div>
      <div>${dinheiro(p.preco * i.qtd)}</div>
    </div>`;
  }).join("");

  $("itens").innerHTML = html || '<p class="vazio">Seu carrinho está vazio.</p>';
  $("total").textContent = dinheiro(total);
  $("contador").textContent = qtdTotal;
  $("finalizar").disabled = qtdTotal === 0;
}

function abrir()  { $("gaveta").classList.add("ativa");    $("fundo").classList.add("ativo"); }
function fechar() { $("gaveta").classList.remove("ativa"); $("fundo").classList.remove("ativo"); }

function validarCampos() {
  const campos = [
    { el: $("nomeCliente"), ok: $("nomeCliente").value.trim().length >= 2,  msg: "Digite seu nome." },
    { el: $("endereco"),    ok: $("endereco").value.trim().length >= 5,    msg: "Digite o endereço de entrega." },
    { el: $("pagamento"),   ok: $("pagamento").value !== "",               msg: "Escolha a forma de pagamento." }
  ];
  campos.forEach(c => c.el.classList.toggle("invalido", !c.ok));
  const erros = campos.filter(c => !c.ok);
  if (erros.length) {
    $("erro").textContent = erros.length === 1 ? erros[0].msg : "Preencha nome, endereço e forma de pagamento.";
    erros[0].el.focus();
    return false;
  }
  $("erro").textContent = "";
  return true;
}

["nomeCliente", "endereco", "pagamento"].forEach(id => {
  const limpar = () => { $(id).classList.remove("invalido"); $("erro").textContent = ""; };
  $(id).addEventListener("input", limpar);
  $(id).addEventListener("change", limpar);
});

function finalizarPedido() {
  if (!validarCampos()) return;

  let total = 0;
  let msg = `Olá! Gostaria de fazer este pedido na ${CONFIG.nomeLoja}:\n\n`;

  carrinho.forEach(i => {
    const p = PRODUTOS.find(x => x.id === i.id);
    if (!p) return;
    const sub = p.preco * i.qtd;
    total += sub;
    msg += `• ${i.qtd}x ${p.nome} - ${dinheiro(sub)}\n`;
  });

  msg += `\n*Total: ${dinheiro(total)}*`;
  msg += `\n\nNome: ${$("nomeCliente").value.trim()}`;
  msg += `\nEndereço: ${$("endereco").value.trim()}`;
  msg += `\nPagamento: ${$("pagamento").value}`;

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
}

$("btnCarrinho").addEventListener("click", abrir);
$("fechar").addEventListener("click", fechar);
$("fundo").addEventListener("click", fechar);
$("finalizar").addEventListener("click", finalizarPedido);

mostrarProdutos();
atualizar();
