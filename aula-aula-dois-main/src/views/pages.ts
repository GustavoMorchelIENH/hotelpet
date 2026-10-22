import { DESCONTO_PIX, MAX_PARCELAS } from '../orders/pricing';
import { layout } from './layout';

const precisaLogin = `
  <div class="text-center py-5">
    <i class="bi bi-person-lock display-4 text-secondary"></i>
    <p class="mt-3 text-secondary">Entre na sua conta para continuar.</p>
    <button class="btn btn-primary" onclick="HotelPet.abrirLogin('login')">Entrar</button>
  </div>
`;

export function paginaCarrinho(): string {
  return layout({
    titulo: 'Carrinho | HotelPet',
    conteudo: `
      <h2 class="fw-bold mb-4">Meu carrinho</h2>
      <div id="carrinho"></div>
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
                (item.dataEntrada ? '<div class="small"><i class="bi bi-calendar-event"></i> ' + HotelPet.periodo(item.dataEntrada, item.diarias) + '</div>' : '') +
                '<div class="small">' + HotelPet.dinheiro(item.hotel.preco) + ' / diária</div>' +
              '</div>' +
              '<div class="fw-bold text-end" style="min-width: 110px">' + HotelPet.dinheiro(item.subtotal) + '</div>' +
              '<button class="btn btn-outline-danger btn-sm" title="Remover" onclick="removerItem(' + item.id + ')"><i class="bi bi-trash"></i></button>' +
            '</div>' +
          '</div>'
        ).join('');

        container.innerHTML =
          '<div class="row g-4">' +
            '<div class="col-lg-8">' + linhas +
              '<button class="btn btn-link text-danger px-0" onclick="esvaziarCarrinho()">Esvaziar carrinho</button>' +
            '</div>' +
            '<div class="col-lg-4">' +
              '<div class="card border-0 shadow-sm rounded-4">' +
                '<div class="card-body">' +
                  '<h5 class="fw-bold mb-3">Resumo</h5>' +
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
      <div id="checkout"></div>

      <template id="tpl-checkout">
        <form id="form-checkout" class="row g-4" autocomplete="off" novalidate>
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

                <div id="dados-cartao" class="mt-3 d-none">
                  <div class="row g-2">
                    <div class="col-12"><input class="form-control" name="titular" autocomplete="off" placeholder="Nome impresso no cartão" /></div>
                    <div class="col-12"><input class="form-control" name="numero" autocomplete="off" placeholder="Número do cartão" inputmode="numeric" maxlength="19" /></div>
                    <div class="col-6"><input class="form-control" name="vencimento" autocomplete="off" placeholder="MM/AA" maxlength="5" /></div>
                    <div class="col-6"><input class="form-control" name="codigo" autocomplete="off" placeholder="CVV" inputmode="numeric" maxlength="4" /></div>
                    <div class="col-12">
                      <label class="form-label small text-muted mb-1" for="parcelas">Parcelas</label>
                      <select class="form-select" name="parcelas" id="parcelas">${opcoesParcelas}</select>
                    </div>
                  </div>
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
            '<span>' + HotelPet.esc(item.hotel.nome) +
              (item.dataEntrada ? '<br /><span class="text-muted">' + HotelPet.periodo(item.dataEntrada, item.diarias) + '</span>' : '') +
            '</span>' +
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

      async function confirmarPagamento(evento) {
        evento.preventDefault();
        const { formaPagamento, parcelas } = lerFormulario();
        const erro = document.getElementById('erro-checkout');
        const botao = document.getElementById('btn-confirmar');
        erro.classList.add('d-none');

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
    conteudo: `<div id="pedido"></div>`,
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
              '<td>' + HotelPet.esc(item.nomeHotel) +
                (item.dataEntrada ? '<div class="small text-muted">' + HotelPet.periodo(item.dataEntrada, item.diarias) + '</div>' : '') +
              '</td>' +
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
                  '<thead><tr><th>Hotel</th><th class="text-end">Diária</th><th class="text-end">Subtotal</th></tr></thead>' +
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
      <div id="pedidos"></div>
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

export function paginaPerfil(): string {
  return layout({
    titulo: 'Meu perfil | HotelPet',
    conteudo: `
      <h2 class="fw-bold mb-4">Meu perfil</h2>
      <div id="perfil"></div>
    `,
    script: `
      const precisaLogin = ${JSON.stringify(precisaLogin)};
      const hoje = new Date();
      let usuarioAtual = null;
      let pets = [];
      let eventos = [];
      let mesExibido = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      let dataSelecionada = dataLocal(hoje);

      function dataLocal(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return ano + '-' + mes + '-' + dia;
      }

      function chaveDados(tipo) {
        return 'hotelpet:usuario:' + usuarioAtual.id + ':' + tipo;
      }

      function lerDados(tipo) {
        try {
          const dados = JSON.parse(localStorage.getItem(chaveDados(tipo)) || '[]');
          return Array.isArray(dados) ? dados : [];
        } catch {
          return [];
        }
      }

      function salvarDados() {
        localStorage.setItem(chaveDados('pets'), JSON.stringify(pets));
        localStorage.setItem(chaveDados('eventos'), JSON.stringify(eventos));
      }

      function carregarPerfil() {
        const container = document.getElementById('perfil');
        usuarioAtual = HotelPet.usuario();

        if (!usuarioAtual) {
          container.innerHTML = precisaLogin;
          return;
        }

        pets = lerDados('pets');
        eventos = lerDados('eventos');
        container.innerHTML =
          '<div class="card border-0 shadow-sm">' +
            '<div class="card-body p-4">' +
              '<h5 class="fw-bold mb-3">Dados da conta</h5>' +
              '<form id="form-perfil" class="row g-3">' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="nome">Nome</label>' +
                  '<input class="form-control" id="nome" name="nome" minlength="2" maxlength="67" required />' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="sobrenome">Sobrenome</label>' +
                  '<input class="form-control" id="sobrenome" name="sobrenome" minlength="2" maxlength="67" required />' +
                '</div>' +
                '<div class="col-12">' +
                  '<label class="form-label" for="email">Email</label>' +
                  '<input class="form-control" id="email" name="email" type="email" required />' +
                '</div>' +
                '<div class="col-12">' +
                  '<div id="erro-perfil" class="alert alert-danger d-none mb-0"></div>' +
                  '<button class="btn btn-primary" type="submit">Salvar alterações</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>' +
          '<div class="card border-0 shadow-sm mt-4">' +
            '<div class="card-body p-4">' +
              '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">' +
                '<h3 class="h5 fw-bold mb-0">Calendário dos pets</h3>' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<button id="mes-anterior" type="button" class="btn btn-outline-secondary" aria-label="Mês anterior"><i class="bi bi-chevron-left"></i></button>' +
                  '<strong id="mes-atual" class="text-center" style="min-width: 150px"></strong>' +
                  '<button id="proximo-mes" type="button" class="btn btn-outline-secondary" aria-label="Próximo mês"><i class="bi bi-chevron-right"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="pet-calendar-scroll">' +
                '<div class="pet-calendar">' +
                  '<div class="pet-calendar-grid text-center small fw-semibold text-secondary mb-2">' +
                    '<div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>' +
                  '</div>' +
                  '<div id="dias-calendario" class="pet-calendar-grid"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        const form = document.getElementById('form-perfil');
        form.elements.nome.value = usuarioAtual.nome || '';
        form.elements.sobrenome.value = usuarioAtual.sobrenome || '';
        form.elements.email.value = usuarioAtual.email || '';
        form.addEventListener('submit', salvarPerfil);

        container.insertAdjacentHTML('beforeend',
          '<div class="row g-4 mt-1">' +
            '<div class="col-lg-5">' +
              '<div class="card border-0 shadow-sm h-100"><div class="card-body p-4">' +
                '<h3 class="h5 fw-bold">Meus pets</h3>' +
                '<form id="form-pet" class="row g-2 mb-3">' +
                  '<div class="col-12"><label class="form-label mb-1" for="pet-nome">Nome</label><input class="form-control" id="pet-nome" name="nome" maxlength="60" required /></div>' +
                  '<div class="col-12"><label class="form-label mb-1" for="pet-especie">Espécie</label><input class="form-control" id="pet-especie" name="especie" placeholder="Cachorro, gato..." maxlength="40" required /></div>' +
                  '<div class="col-12"><button class="btn btn-primary" type="submit"><i class="bi bi-plus-lg me-1"></i>Cadastrar pet</button></div>' +
                '</form>' +
                '<ul id="lista-pets" class="list-group list-group-flush"></ul>' +
              '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="modal fade" id="eventoModal" tabindex="-1" aria-labelledby="titulo-evento-modal" aria-hidden="true">' +
            '<div class="modal-dialog modal-dialog-centered">' +
              '<div class="modal-content">' +
                '<div class="modal-header">' +
                  '<div><h3 class="modal-title h5 fw-bold mb-1" id="titulo-evento-modal">Compromissos do dia</h3>' +
                    '<div class="small text-secondary" id="titulo-dia"></div></div>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<form id="form-evento" class="row g-2">' +
                    '<div class="col-md-6"><label class="form-label mb-1" for="evento-pet">Pet</label><select class="form-select" id="evento-pet" name="petId" required></select></div>' +
                    '<div class="col-md-6"><label class="form-label mb-1" for="evento-tipo">Tipo</label><select class="form-select" id="evento-tipo" name="tipo"><option>Tosa</option><option>Banho</option><option>Veterinário</option><option>Vacina</option><option>Passeio</option><option>Outro</option></select></div>' +
                    '<div class="col-md-6"><label class="form-label mb-1" for="evento-data">Data</label><input class="form-control" id="evento-data" name="data" type="date" required /></div>' +
                    '<div class="col-md-6"><label class="form-label mb-1" for="evento-hora">Horário</label><input class="form-control" id="evento-hora" name="hora" type="time" /></div>' +
                    '<div class="col-12"><label class="form-label mb-1" for="evento-detalhes">Observação</label><input class="form-control" id="evento-detalhes" name="detalhes" maxlength="120" placeholder="Ex.: levar a carteirinha de vacinação" /></div>' +
                    '<div class="col-12"><button class="btn btn-primary" type="submit"><i class="bi bi-calendar-plus me-1"></i>Adicionar ao calendário</button></div>' +
                  '</form>' +
                  '<hr />' +
                  '<h4 class="h6 fw-bold">Eventos cadastrados</h4>' +
                  '<div id="eventos-dia"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');

        document.getElementById('mes-anterior').addEventListener('click', () => {
          mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1);
          renderizarCalendario();
        });
        document.getElementById('proximo-mes').addEventListener('click', () => {
          mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1);
          renderizarCalendario();
        });
        document.getElementById('form-pet').addEventListener('submit', cadastrarPet);
        document.getElementById('form-evento').addEventListener('submit', cadastrarEvento);
        document.getElementById('dias-calendario').addEventListener('click', (evento) => {
          const botao = evento.target.closest('[data-cal-data]');
          if (!botao) return;

          dataSelecionada = botao.dataset.calData;
          document.getElementById('evento-data').value = dataSelecionada;
          renderizarCalendario();
          renderizarEventos();
          bootstrap.Modal.getOrCreateInstance(document.getElementById('eventoModal')).show();
        });
        document.getElementById('evento-data').value = dataSelecionada;
        renderizarPets();
        renderizarCalendario();
        renderizarEventos();
      }

      function renderizarPets() {
        const lista = document.getElementById('lista-pets');
        const select = document.getElementById('evento-pet');

        if (pets.length === 0) {
          lista.innerHTML = '<li class="list-group-item px-0 text-secondary">Nenhum pet cadastrado ainda.</li>';
          select.innerHTML = '<option value="">Cadastre um pet primeiro</option>';
        } else {
          lista.innerHTML = pets.map((pet) =>
            '<li class="list-group-item px-0"><span class="fw-semibold">' + HotelPet.esc(pet.nome) + '</span><span class="text-secondary"> · ' + HotelPet.esc(pet.especie) + '</span></li>'
          ).join('');
          select.innerHTML = pets.map((pet) =>
            '<option value="' + pet.id + '">' + HotelPet.esc(pet.nome) + ' · ' + HotelPet.esc(pet.especie) + '</option>'
          ).join('');
        }

        document.querySelector('#form-evento button[type="submit"]').disabled = pets.length === 0;
      }

      function renderizarCalendario() {
        const ano = mesExibido.getFullYear();
        const mes = mesExibido.getMonth();
        const primeiroDia = new Date(ano, mes, 1).getDay();
        const quantidadeDias = new Date(ano, mes + 1, 0).getDate();
        const celulas = [];

        document.getElementById('mes-atual').textContent = mesExibido.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        for (let indice = 0; indice < primeiroDia; indice++) {
          celulas.push('<div></div>');
        }

        for (let dia = 1; dia <= quantidadeDias; dia++) {
          const data = dataLocal(new Date(ano, mes, dia));
          const eventosDoDia = eventos.filter((evento) => evento.data === data);
          const selecionado = data === dataSelecionada;
          const classe = selecionado ? 'btn-primary' : 'btn-light';
          const nomesEventos = eventosDoDia.slice(0, 2).map((evento) =>
            '<span class="d-block small text-truncate mt-1">' + HotelPet.esc(evento.tipo) + ' · ' + HotelPet.esc(nomeDoPet(evento.petId)) + '</span>'
          ).join('');
          const maisEventos = eventosDoDia.length > 2 ? '<span class="small">+' + (eventosDoDia.length - 2) + ' eventos</span>' : '';

          celulas.push(
            '<button type="button" class="btn ' + classe + ' pet-calendar-day text-start" data-cal-data="' + data + '">' +
              '<span class="fw-semibold">' + dia + '</span>' + nomesEventos + maisEventos +
            '</button>'
          );
        }

        document.getElementById('dias-calendario').innerHTML = celulas.join('');
      }

      function nomeDoPet(petId) {
        const pet = pets.find((item) => item.id === Number(petId));
        return pet ? pet.nome : 'Pet';
      }

      function renderizarEventos() {
        const data = new Date(dataSelecionada + 'T00:00:00');
        const lista = eventos
          .filter((evento) => evento.data === dataSelecionada)
          .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

        document.getElementById('titulo-dia').textContent = data.toLocaleDateString('pt-BR');

        if (lista.length === 0) {
          document.getElementById('eventos-dia').innerHTML = '<p class="small text-secondary mb-0">Nenhum evento neste dia.</p>';
          return;
        }

        document.getElementById('eventos-dia').innerHTML = lista.map((evento) =>
          '<div class="d-flex justify-content-between align-items-start gap-2 border-bottom py-2">' +
            '<div><span class="badge text-bg-primary me-1">' + HotelPet.esc(evento.tipo) + '</span>' +
              '<span class="fw-semibold">' + HotelPet.esc(nomeDoPet(evento.petId)) + '</span>' +
              (evento.hora ? '<span class="small text-secondary ms-2">' + HotelPet.esc(evento.hora) + '</span>' : '') +
              (evento.detalhes ? '<div class="small text-secondary mt-1">' + HotelPet.esc(evento.detalhes) + '</div>' : '') +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-remover-evento="' + evento.id + '" aria-label="Remover evento"><i class="bi bi-trash"></i></button>' +
          '</div>'
        ).join('');

        document.querySelectorAll('[data-remover-evento]').forEach((botao) => {
          botao.addEventListener('click', () => {
            eventos = eventos.filter((evento) => evento.id !== Number(botao.dataset.removerEvento));
            salvarDados();
            renderizarCalendario();
            renderizarEventos();
          });
        });
      }

      function cadastrarPet(evento) {
        evento.preventDefault();
        const form = evento.currentTarget;
        pets.push({
          id: Date.now(),
          nome: form.elements.nome.value.trim(),
          especie: form.elements.especie.value.trim(),
        });
        salvarDados();
        form.reset();
        renderizarPets();
      }

      function cadastrarEvento(evento) {
        evento.preventDefault();
        const form = evento.currentTarget;
        const dados = Object.fromEntries(new FormData(form));
        const data = String(dados.data);
        const dataDoEvento = new Date(data + 'T00:00:00');

        eventos.push({
          id: Date.now(),
          petId: Number(dados.petId),
          tipo: String(dados.tipo),
          data,
          hora: String(dados.hora),
          detalhes: String(dados.detalhes).trim(),
        });
        dataSelecionada = data;
        mesExibido = new Date(dataDoEvento.getFullYear(), dataDoEvento.getMonth(), 1);
        salvarDados();
        renderizarCalendario();
        renderizarEventos();
        form.reset();
        form.elements.data.value = dataSelecionada;
      }

      async function salvarPerfil(evento) {
        evento.preventDefault();
        const usuario = HotelPet.usuario();
        const form = evento.currentTarget;
        const erro = document.getElementById('erro-perfil');
        const botao = form.querySelector('button[type="submit"]');
        erro.classList.add('d-none');
        botao.disabled = true;

        const dados = {
          nome: form.elements.nome.value.trim(),
          sobrenome: form.elements.sobrenome.value.trim(),
          email: form.elements.email.value.trim(),
        };

        try {
          await HotelPet.api('/users/' + usuario.id, {
            method: 'PATCH',
            body: JSON.stringify(dados),
          });
          const usuarioAtualizado = { id: usuario.id, ...dados };
          HotelPet.salvarUsuario(usuarioAtualizado);
          HotelPet.renderizarNav();
          HotelPet.aviso('Perfil atualizado');
        } catch (e) {
          erro.textContent = e.message;
          erro.classList.remove('d-none');
        } finally {
          botao.disabled = false;
        }
      }

      document.addEventListener('hotelpet:login', carregarPerfil);
      carregarPerfil();
    `,
  });
}
