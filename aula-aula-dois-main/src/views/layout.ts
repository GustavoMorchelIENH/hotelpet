export function escapeHtml(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LayoutOptions {
  titulo: string;
  conteudo: string;
  script?: string;
}

export function layout({ titulo, conteudo, script = '' }: LayoutOptions) {
  return `
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(titulo)}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <style>
        body { background: #f5f7fb; }
        .navbar-brand { font-weight: 700; }
        .carousel-item img { height: 420px; object-fit: cover; }
        .cart-thumb { width: 96px; height: 72px; object-fit: cover; }
      </style>
    </head>
    <body>
      <nav class="navbar navbar-light bg-white shadow-sm sticky-top">
        <div class="container">
          <a class="navbar-brand text-primary" href="/">HotelPet</a>
          <div class="d-flex align-items-center gap-2">
            <a href="/carrinho" class="btn btn-outline-secondary btn-sm position-relative" title="Carrinho">
              <i class="bi bi-cart3"></i> Carrinho
              <span id="cart-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
            </a>
            <div id="nav-actions" class="d-flex align-items-center gap-2"></div>
          </div>
        </div>
      </nav>

      <main class="container py-4">
        ${conteudo}
      </main>

      <div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <ul class="nav nav-pills" role="tablist">
                <li class="nav-item">
                  <button class="nav-link active" id="tab-login" data-bs-toggle="pill" data-bs-target="#pane-login" type="button">Entrar</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" id="tab-cadastro" data-bs-toggle="pill" data-bs-target="#pane-cadastro" type="button">Cadastre-se</button>
                </li>
              </ul>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body tab-content">
              <div class="tab-pane fade show active" id="pane-login">
                <form id="form-login" class="d-grid gap-3">
                  <input name="email" type="email" class="form-control" placeholder="Email" required />
                  <input name="senha" type="password" class="form-control" placeholder="Senha" required />
                  <div class="text-danger small d-none" data-erro></div>
                  <button class="btn btn-primary" type="submit">Entrar</button>
                </form>
              </div>
              <div class="tab-pane fade" id="pane-cadastro">
                <form id="form-cadastro" class="d-grid gap-3">
                  <div class="row g-2">
                    <div class="col"><input name="nome" class="form-control" placeholder="Nome" minlength="2" maxlength="67" required /></div>
                    <div class="col"><input name="sobrenome" class="form-control" placeholder="Sobrenome" minlength="2" maxlength="67" required /></div>
                  </div>
                  <input name="email" type="email" class="form-control" placeholder="Email" required />
                  <input name="senha" type="password" class="form-control" placeholder="Senha (mínimo 8 caracteres)" minlength="8" maxlength="67" required />
                  <div class="text-danger small d-none" data-erro></div>
                  <button class="btn btn-primary" type="submit">Criar conta</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toasts"></div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        const HotelPet = {
          chaveUsuario: 'hotelpet:usuario',
          acaoPendente: null,

          usuario() {
            try {
              return JSON.parse(localStorage.getItem(this.chaveUsuario));
            } catch {
              return null;
            }
          },

          salvarUsuario(usuario) {
            localStorage.setItem(this.chaveUsuario, JSON.stringify(usuario));
          },

          sair() {
            localStorage.removeItem(this.chaveUsuario);
            window.location.href = '/';
          },

          dinheiro(valor) {
            return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          },

          // Datas vêm do banco como meia-noite UTC; formatar em UTC evita mostrar o dia anterior
          data(valor) {
            return new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
          },

          periodo(dataEntrada, diarias) {
            if (!dataEntrada) return '';
            const saida = new Date(dataEntrada);
            saida.setUTCDate(saida.getUTCDate() + diarias);
            return this.data(dataEntrada) + ' a ' + this.data(saida);
          },

          esc(valor) {
            const div = document.createElement('div');
            div.textContent = valor ?? '';
            return div.innerHTML;
          },

          aviso(mensagem, tipo = 'success') {
            const el = document.createElement('div');
            el.className = 'toast align-items-center border-0 text-bg-' + tipo;
            el.innerHTML = '<div class="d-flex"><div class="toast-body"></div>' +
              '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
            el.querySelector('.toast-body').textContent = mensagem;
            document.getElementById('toasts').appendChild(el);
            el.addEventListener('hidden.bs.toast', () => el.remove());
            new bootstrap.Toast(el, { delay: 3000 }).show();
          },

          async api(url, opcoes = {}) {
            const resposta = await fetch(url, {
              ...opcoes,
              headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) },
            });
            const dados = await resposta.json().catch(() => null);

            if (!resposta.ok) {
              const mensagem = dados && dados.message;
              throw new Error(Array.isArray(mensagem) ? mensagem.join(', ') : mensagem || 'Erro inesperado');
            }

            return dados;
          },

          abrirLogin(aba = 'login', acao = null) {
            this.acaoPendente = acao;
            bootstrap.Tab.getOrCreateInstance(document.getElementById('tab-' + aba)).show();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('authModal')).show();
          },

          // Executa a ação se houver usuário logado; caso contrário, pede login e executa depois
          exigirLogin(acao) {
            const usuario = this.usuario();
            if (usuario) return acao(usuario);
            this.abrirLogin('login', acao);
          },

          renderizarNav() {
            const usuario = this.usuario();
            const nav = document.getElementById('nav-actions');

            if (usuario) {
              nav.innerHTML =
                '<span class="small text-muted d-none d-sm-inline">Olá, ' + this.esc(usuario.nome) + '</span>' +
                '<a href="/pedidos" class="btn btn-outline-primary btn-sm">Meus pedidos</a>' +
                '<button class="btn btn-link btn-sm text-decoration-none" onclick="HotelPet.sair()">Sair</button>';
            } else {
              nav.innerHTML =
                '<button class="btn btn-outline-primary btn-sm" onclick="HotelPet.abrirLogin(\\'login\\')">Entrar</button>' +
                '<button class="btn btn-primary btn-sm" onclick="HotelPet.abrirLogin(\\'cadastro\\')">Cadastre-se</button>';
            }
          },

          async atualizarBadge() {
            const badge = document.getElementById('cart-badge');
            const usuario = this.usuario();

            if (!usuario) {
              badge.classList.add('d-none');
              return;
            }

            try {
              const carrinho = await this.api('/cart/' + usuario.id);
              const quantidade = carrinho.itens.length;
              badge.textContent = quantidade;
              badge.classList.toggle('d-none', quantidade === 0);
            } catch {
              badge.classList.add('d-none');
            }
          },

          async entrou(usuario, mensagem) {
            this.salvarUsuario(usuario);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('authModal')).hide();
            this.renderizarNav();
            this.aviso(mensagem);

            const acao = this.acaoPendente;
            this.acaoPendente = null;
            if (acao) await acao(usuario);
            await this.atualizarBadge();
            document.dispatchEvent(new CustomEvent('hotelpet:login', { detail: usuario }));
          },
        };

        function configurarFormulario(id, enviar) {
          const form = document.getElementById(id);
          const erro = form.querySelector('[data-erro]');

          form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            erro.classList.add('d-none');
            const botao = form.querySelector('button[type=submit]');
            botao.disabled = true;

            try {
              await enviar(Object.fromEntries(new FormData(form)));
              form.reset();
            } catch (e) {
              erro.textContent = e.message;
              erro.classList.remove('d-none');
            } finally {
              botao.disabled = false;
            }
          });
        }

        configurarFormulario('form-login', async (dados) => {
          const usuario = await HotelPet.api('/users/login', { method: 'POST', body: JSON.stringify(dados) });
          await HotelPet.entrou(usuario, 'Bem-vindo de volta, ' + usuario.nome + '!');
        });

        configurarFormulario('form-cadastro', async (dados) => {
          const criado = await HotelPet.api('/users', { method: 'POST', body: JSON.stringify(dados) });
          const usuario = { id: criado.id, nome: criado.nome, sobrenome: criado.sobrenome, email: criado.email };
          await HotelPet.entrou(usuario, 'Conta criada! Bem-vindo, ' + usuario.nome + '!');
        });

        HotelPet.renderizarNav();
        HotelPet.atualizarBadge();
      </script>
      <script>
        ${script}
      </script>
    </body>
    </html>
  `;
}
