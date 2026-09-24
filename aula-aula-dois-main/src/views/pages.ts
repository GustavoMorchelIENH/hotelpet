import { DESCONTO_PIX, MAX_PARCELAS } from '../orders/pricing';
import { layout } from './layout';

const precisaLogin = `
  <div class="text-center py-5">
    <i class="bi bi-person-lock display-4 text-secondary"></i>
    <p class="mt-3 text-secondary">Entre na sua conta para continuar.</p>
    <button class="btn btn-primary" onclick="HotelPet.abrirLogin('login')">Entrar</button>
  </div>
`;

const carregando = `
  <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
`;

export function paginaCarrinho(): string {
  return layout({
    titulo: 'Carrinho | HotelPet',
    conteudo: `
      <h2 class="fw-bold mb-4">Meu carrinho</h2>
      <div id="carrinho">${carregando}</div>
    `,
    script: `
      const precisaLogin = ${JSON.stringify(precisaLogin)};

      async function carregarCarrinho() {
        const container = document.getElementById('carrinho');
        const usuario = HotelPet.usuario();

        if (!usuario) {
          container.innerHTML = precisaLogin;
          return;
        }

        try {
          const carrinho = await HotelPet.api('/cart/' + usuario.id);
          renderizarCarrinho(carrinho);
        } catch (e) {
          container.innerHTML = '<div class="alert alert-danger">' + HotelPet.esc(e.message) + '</div>';
        }
      }

      function renderizarCarrinho(carrinho) {
        const container = document.getElementById('carrinho');

        if (carrinho.itens.length === 0) {
          container.innerHTML =
            '<div class="text-center py-5">' +
              '<i class="bi bi-cart-x display-4 text-secondary"></i>' +
              '<p class="mt-3 text-secondary">Seu carrinho está vazio.</p>' +
              '<a href="/" class="btn btn-primary">Ver hotéis</a>' +
            '</div>';
          return;
        }

        const linhas = carrinho.itens.map((item) =>
          '<div class="card border-0 shadow-sm rounded-4 mb-3">' +
            '<div class="card-body d-flex flex-wrap align-items-center gap-3">' +
              '<img src="' + HotelPet.esc(item.hotel.fotoUrl) + '" class="cart-thumb rounded-3" alt="" />' +
              '<div class="flex-grow-1">' +
                '<h5 class="mb-1">' + HotelPet.esc(item.hotel.nome) + '</h5>' +
                '<div class="small text-muted">' + HotelPet.esc(item.hotel.endereco) + '</div>' +
                '<div class="small">' + HotelPet.dinheiro(item.hotel.preco) + ' / diária</div>' +
              '</div>' +
              '<div class="input-group input-group-sm w-auto">' +
                '<button class="btn btn-outline-secondary" onclick="alterarDiarias(' + item.id + ', ' + (item.diarias - 1) + ')"' + (item.diarias <= 1 ? ' disabled' : '') + '>−</button>' +
                '<span class="input-group-text bg-white diarias-input justify-content-center">' + item.diarias + '</span>' +
                '<button class="btn btn-outline-secondary" onclick="alterarDiarias(' + item.id + ', ' + (item.diarias + 1) + ')">+</button>' +
              '</div>' +
              '<div class="fw-bold text-end" style="min-width: 110px">' + HotelPet.dinheiro(item.subtotal) + '</div>' +
              '<button class="btn btn-outline-danger btn-sm" title="Remover" onclick="removerItem(' + item.id + ')"><i class="bi bi-trash"></i></button>' +
            '</div>' +
          '</div>'
        ).join('');

        const totalDiarias = carrinho.itens.reduce((soma, item) => soma + item.diarias, 0);

        container.innerHTML =
          '<div class="row g-4">' +
            '<div class="col-lg-8">' + linhas +
              '<button class="btn btn-link text-danger px-0" onclick="esvaziarCarrinho()">Esvaziar carrinho</button>' +
            '</div>' +
            '<div class="col-lg-4">' +
              '<div class="card border-0 shadow-sm rounded-4">' +
                '<div class="card-body">' +
                  '<h5 class="fw-bold mb-3">Resumo</h5>' +
                  '<div class="d-flex justify-content-between mb-2"><span>Diárias</span><span>' + totalDiarias + '</span></div>' +
                  '<div class="d-flex justify-content-between mb-3"><span>Subtotal</span><span>' + HotelPet.dinheiro(carrinho.total) + '</span></div>' +
                  '<hr />' +
                  '<div class="d-flex justify-content-between fs-5 fw-bold mb-3"><span>Total</span><span class="text-primary">' + HotelPet.dinheiro(carrinho.total) + '</span></div>' +
                  '<a href="/checkout" class="btn btn-primary w-100">Finalizar compra</a>' +
                  '<a href="/" class="btn btn-outline-secondary w-100 mt-2">Continuar comprando</a>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      async function alterarDiarias(itemId, diarias) {
        if (diarias < 1) return;
        const usuario = HotelPet.usuario();

        try {
          await HotelPet.api('/cart/' + usuario.id + '/' + itemId, { method: 'PATCH', body: JSON.stringify({ diarias }) });
          await carregarCarrinho();
        } catch (e) {
          HotelPet.aviso(e.message, 'danger');
        }
      }

      async function removerItem(itemId) {
        const usuario = HotelPet.usuario();

        try {
          await HotelPet.api('/cart/' + usuario.id + '/' + itemId, { method: 'DELETE' });
          HotelPet.aviso('Item removido do carrinho');
          await Promise.all([carregarCarrinho(), HotelPet.atualizarBadge()]);
        } catch (e) {
          HotelPet.aviso(e.message, 'danger');
        }
      }

      async function esvaziarCarrinho() {
        if (!confirm('Deseja remover todos os itens do carrinho?')) return;
        const usuario = HotelPet.usuario();

        try {
          await HotelPet.api('/cart/' + usuario.id, { method: 'DELETE' });
          await Promise.all([carregarCarrinho(), HotelPet.atualizarBadge()]);
        } catch (e) {
          HotelPet.aviso(e.message, 'danger');
        }
      }

      document.addEventListener('hotelpet:login', carregarCarrinho);
      carregarCarrinho();
    `,
  });
}

export function paginaCheckout(): string {
  const opcoesParcelas = Array.from(
    { length: MAX_PARCELAS },
    (_, i) => `<option value="${i + 1}">${i + 1}x</option>`,
  ).join('');

  return layout({
    titulo: 'Finalizar compra | HotelPet',
    conteudo: `
      <nav class="mb-3 small"><a href="/carrinho">← Voltar ao carrinho</a></nav>
      <h2 class="fw-bold mb-4">Finalizar compra</h2>
      <div id="checkout">${carregando}</div>

      <template id="tpl-checkout">
        <form id="form-checkout" class="row g-4">
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body">
                <h5 class="fw-bold mb-3">Forma de pagamento</h5>

                <div class="form-check border rounded-3 p-3 ps-5 mb-2">
                  <input class="form-check-input" type="radio" name="formaPagamento" id="pg-pix" value="pix" checked />
                  <label class="form-check-label w-100" for="pg-pix">
                    <i class="bi bi-qr-code"></i> PIX
                    <span class="badge text-bg-success ms-2">${Math.round(DESCONTO_PIX * 100)}% de desconto</span>
                  </label>
                </div>
                <div class="form-check border rounded-3 p-3 ps-5">
                  <input class="form-check-input" type="radio" name="formaPagamento" id="pg-cartao" value="cartao" />
                  <label class="form-check-label w-100" for="pg-cartao">
                    <i class="bi bi-credit-card"></i> Cartão de crédito
                    <span class="text-muted small ms-2">em até ${MAX_PARCELAS}x sem juros</span>
                  </label>
                </div>

                <div id="dados-pix" class="alert alert-light border mt-3 mb-0 small">
                  Após confirmar, o pagamento via PIX é aprovado na hora (simulação).
                </div>

                <div id="dados-cartao" class="mt-3 d-none">
                  <div class="row g-2">
                    <div class="col-12"><input class="form-control" name="nomeCartao" placeholder="Nome impresso no cartão" /></div>
                    <div class="col-12"><input class="form-control" name="numeroCartao" placeholder="Número do cartão" inputmode="numeric" maxlength="19" /></div>
                    <div class="col-6"><input class="form-control" name="validade" placeholder="MM/AA" maxlength="5" /></div>
                    <div class="col-6"><input class="form-control" name="cvv" placeholder="CVV" inputmode="numeric" maxlength="4" /></div>
                    <div class="col-12">
                      <label class="form-label small text-muted mb-1" for="parcelas">Parcelas</label>
                      <select class="form-select" name="parcelas" id="parcelas">${opcoesParcelas}</select>
                    </div>
                  </div>
                  <div class="form-text">Os dados do cartão não são enviados nem armazenados (pagamento simulado).</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body">
                <h5 class="fw-bold mb-3">Resumo do pedido</h5>
                <div id="resumo-itens"></div>
                <hr />
                <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span id="resumo-subtotal"></span></div>
                <div class="d-flex justify-content-between mb-2 text-success"><span>Desconto PIX</span><span id="resumo-desconto"></span></div>
                <hr />
                <div class="d-flex justify-content-between fs-5 fw-bold"><span>Total</span><span class="text-primary" id="resumo-total"></span></div>
                <div class="text-end small text-muted mb-3" id="resumo-parcelas"></div>
                <div class="text-danger small mb-2 d-none" id="erro-checkout"></div>
                <button class="btn btn-success w-100" type="submit" id="btn-confirmar">Confirmar pagamento</button>
              </div>
            </div>
          </div>
        </form>
      </template>
    `,
    script: `
      const DESCONTO_PIX = ${DESCONTO_PIX};
      const precisaLogin = ${JSON.stringify(precisaLogin)};
      let carrinhoAtual = null;

      // Mesma regra de src/orders/pricing.ts; o valor final é sempre recalculado no servidor
      function calcularTotais(itens, formaPagamento, parcelas) {
        const subtotal = itens.reduce((soma, item) => soma + Math.round(item.hotel.preco * 100) * item.diarias, 0);
        const desconto = formaPagamento === 'pix' ? Math.round(subtotal * DESCONTO_PIX) : 0;
        const total = subtotal - desconto;
        const numeroParcelas = formaPagamento === 'cartao' ? parcelas : 1;

        return {
          subtotal: subtotal / 100,
          desconto: desconto / 100,
          total: total / 100,
          parcelas: numeroParcelas,
          valorParcela: Math.round(total / numeroParcelas) / 100,
        };
      }

      async function carregarCheckout() {
        const container = document.getElementById('checkout');
        const usuario = HotelPet.usuario();

        if (!usuario) {
          container.innerHTML = precisaLogin;
          return;
        }

        try {
          carrinhoAtual = await HotelPet.api('/cart/' + usuario.id);
        } catch (e) {
          container.innerHTML = '<div class="alert alert-danger">' + HotelPet.esc(e.message) + '</div>';
          return;
        }

        if (carrinhoAtual.itens.length === 0) {
          window.location.href = '/carrinho';
          return;
        }

        container.replaceChildren(document.getElementById('tpl-checkout').content.cloneNode(true));

        document.getElementById('resumo-itens').innerHTML = carrinhoAtual.itens.map((item) =>
          '<div class="d-flex justify-content-between small mb-2">' +
            '<span>' + HotelPet.esc(item.hotel.nome) + ' <span class="text-muted">· ' + item.diarias + 'x ' + HotelPet.dinheiro(item.hotel.preco) + '</span></span>' +
            '<span>' + HotelPet.dinheiro(item.subtotal) + '</span>' +
          '</div>'
        ).join('');

        const form = document.getElementById('form-checkout');
        form.addEventListener('change', atualizarResumo);
        form.addEventListener('submit', confirmarPagamento);
        atualizarResumo();
      }

      function lerFormulario() {
        const form = document.getElementById('form-checkout');
        const formaPagamento = form.formaPagamento.value;
        const parcelas = Number(form.parcelas.value);
        return { form, formaPagamento, parcelas };
      }

      function atualizarResumo() {
        const { formaPagamento, parcelas } = lerFormulario();
        const totais = calcularTotais(carrinhoAtual.itens, formaPagamento, parcelas);
        const cartao = formaPagamento === 'cartao';

        document.getElementById('dados-cartao').classList.toggle('d-none', !cartao);
        document.getElementById('dados-pix').classList.toggle('d-none', cartao);
        document.getElementById('resumo-subtotal').textContent = HotelPet.dinheiro(totais.subtotal);
        document.getElementById('resumo-desconto').textContent = '− ' + HotelPet.dinheiro(totais.desconto);
        document.getElementById('resumo-total').textContent = HotelPet.dinheiro(totais.total);
        document.getElementById('resumo-parcelas').textContent = cartao
          ? totais.parcelas + 'x de ' + HotelPet.dinheiro(totais.valorParcela) + ' sem juros'
          : 'à vista no PIX';

        const select = document.getElementById('parcelas');
        const totalCartao = calcularTotais(carrinhoAtual.itens, 'cartao', 1).total;
        for (const opcao of select.options) {
          const n = Number(opcao.value);
          opcao.textContent = n + 'x de ' + HotelPet.dinheiro(Math.round((totalCartao * 100) / n) / 100);
        }
      }

      function validarCartao(form) {
        const numero = form.numeroCartao.value.replace(/\\D/g, '');
        if (form.nomeCartao.value.trim().length < 3) return 'Informe o nome impresso no cartão';
        if (numero.length < 13 || numero.length > 19) return 'Número do cartão inválido';
        if (!/^(0[1-9]|1[0-2])\\/\\d{2}$/.test(form.validade.value)) return 'Validade inválida (use MM/AA)';
        if (!/^\\d{3,4}$/.test(form.cvv.value)) return 'CVV inválido';
        return null;
      }

      async function confirmarPagamento(evento) {
        evento.preventDefault();
        const { form, formaPagamento, parcelas } = lerFormulario();
        const erro = document.getElementById('erro-checkout');
        const botao = document.getElementById('btn-confirmar');
        erro.classList.add('d-none');

        if (formaPagamento === 'cartao') {
          const problema = validarCartao(form);
          if (problema) {
            erro.textContent = problema;
            erro.classList.remove('d-none');
            return;
          }
        }

        botao.disabled = true;
        botao.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';

        try {
          const usuario = HotelPet.usuario();
          const pedido = await HotelPet.api('/orders/' + usuario.id, {
            method: 'POST',
            body: JSON.stringify(formaPagamento === 'cartao' ? { formaPagamento, parcelas } : { formaPagamento }),
          });
          window.location.href = '/pedido/' + pedido.id;
        } catch (e) {
          erro.textContent = e.message;
          erro.classList.remove('d-none');
          botao.disabled = false;
          botao.textContent = 'Confirmar pagamento';
        }
      }

      document.addEventListener('hotelpet:login', carregarCheckout);
      carregarCheckout();
    `,
  });
}

const scriptFormatarPedido = `
  function descreverPagamento(pedido) {
    return pedido.formaPagamento === 'pix'
      ? 'PIX à vista'
      : 'Cartão de crédito · ' + pedido.parcelas + 'x de ' + HotelPet.dinheiro(pedido.valorParcela);
  }

  function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
`;

export function paginaPedido(orderId: number): string {
  return layout({
    titulo: 'Pedido confirmado | HotelPet',
    conteudo: `<div id="pedido">${carregando}</div>`,
    script: `
      const precisaLogin = ${JSON.stringify(precisaLogin)};
      ${scriptFormatarPedido}

      async function carregarPedido() {
        const container = document.getElementById('pedido');
        const usuario = HotelPet.usuario();

        if (!usuario) {
          container.innerHTML = precisaLogin;
          return;
        }

        try {
          const pedido = await HotelPet.api('/orders/' + usuario.id + '/' + ${orderId});
          const itens = pedido.itens.map((item) =>
            '<tr>' +
              '<td>' + HotelPet.esc(item.nomeHotel) + '</td>' +
              '<td class="text-center">' + item.diarias + '</td>' +
              '<td class="text-end">' + HotelPet.dinheiro(item.precoUnitario) + '</td>' +
              '<td class="text-end">' + HotelPet.dinheiro(item.subtotal) + '</td>' +
            '</tr>'
          ).join('');

          container.innerHTML =
            '<div class="row justify-content-center"><div class="col-lg-8">' +
              '<div class="text-center mb-4">' +
                '<i class="bi bi-check-circle-fill text-success display-3"></i>' +
                '<h2 class="fw-bold mt-2">Pagamento aprovado!</h2>' +
                '<p class="text-secondary mb-0">Pedido #' + pedido.id + ' · ' + formatarData(pedido.criadoEm) + '</p>' +
              '</div>' +
              '<div class="card border-0 shadow-sm rounded-4"><div class="card-body">' +
                '<table class="table align-middle">' +
                  '<thead><tr><th>Hotel</th><th class="text-center">Diárias</th><th class="text-end">Diária</th><th class="text-end">Subtotal</th></tr></thead>' +
                  '<tbody>' + itens + '</tbody>' +
                '</table>' +
                '<div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>' + HotelPet.dinheiro(pedido.subtotal) + '</span></div>' +
                (pedido.desconto > 0
                  ? '<div class="d-flex justify-content-between mb-2 text-success"><span>Desconto PIX</span><span>− ' + HotelPet.dinheiro(pedido.desconto) + '</span></div>'
                  : '') +
                '<hr />' +
                '<div class="d-flex justify-content-between fs-5 fw-bold"><span>Total pago</span><span class="text-primary">' + HotelPet.dinheiro(pedido.total) + '</span></div>' +
                '<div class="text-end small text-muted">' + descreverPagamento(pedido) + '</div>' +
              '</div></div>' +
              '<div class="d-flex gap-2 justify-content-center mt-4">' +
                '<a href="/" class="btn btn-primary">Voltar para a loja</a>' +
                '<a href="/pedidos" class="btn btn-outline-primary">Meus pedidos</a>' +
              '</div>' +
            '</div></div>';
        } catch (e) {
          container.innerHTML = '<div class="alert alert-danger">' + HotelPet.esc(e.message) + '</div>';
        }
      }

      document.addEventListener('hotelpet:login', carregarPedido);
      carregarPedido();
    `,
  });
}

export function paginaPedidos(): string {
  return layout({
    titulo: 'Meus pedidos | HotelPet',
    conteudo: `
      <h2 class="fw-bold mb-4">Meus pedidos</h2>
      <div id="pedidos">${carregando}</div>
    `,
    script: `
      const precisaLogin = ${JSON.stringify(precisaLogin)};
      ${scriptFormatarPedido}

      async function carregarPedidos() {
        const container = document.getElementById('pedidos');
        const usuario = HotelPet.usuario();

        if (!usuario) {
          container.innerHTML = precisaLogin;
          return;
        }

        try {
          const pedidos = await HotelPet.api('/orders/' + usuario.id);

          if (pedidos.length === 0) {
            container.innerHTML =
              '<div class="text-center py-5">' +
                '<p class="text-secondary">Você ainda não fez nenhum pedido.</p>' +
                '<a href="/" class="btn btn-primary">Ver hotéis</a>' +
              '</div>';
            return;
          }

          container.innerHTML = pedidos.map((pedido) =>
            '<a href="/pedido/' + pedido.id + '" class="card border-0 shadow-sm rounded-4 mb-3 text-decoration-none text-body">' +
              '<div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">' +
                '<div>' +
                  '<div class="fw-bold">Pedido #' + pedido.id + '</div>' +
                  '<div class="small text-muted">' + formatarData(pedido.criadoEm) + ' · ' +
                    pedido.itens.map((item) => HotelPet.esc(item.nomeHotel)).join(', ') + '</div>' +
                '</div>' +
                '<div class="text-end">' +
                  '<div class="fw-bold text-primary">' + HotelPet.dinheiro(pedido.total) + '</div>' +
                  '<div class="small text-muted">' + descreverPagamento(pedido) + '</div>' +
                '</div>' +
              '</div>' +
            '</a>'
          ).join('');
        } catch (e) {
          container.innerHTML = '<div class="alert alert-danger">' + HotelPet.esc(e.message) + '</div>';
        }
      }

      document.addEventListener('hotelpet:login', carregarPedidos);
      carregarPedidos();
    `,
  });
}
