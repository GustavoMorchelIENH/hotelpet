import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { escapeHtml, layout } from './views/layout';
import {
  paginaCarrinho,
  paginaCheckout,
  paginaPedido,
  paginaPedidos,
} from './views/pages';

const fotoPadrao =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80';

function fotoDoHotel(fotoUrl: string | null): string {
  return fotoUrl || fotoPadrao;
}

function estrelas(quantidade: number): string {
  return `${'★'.repeat(quantidade)}${'☆'.repeat(Math.max(0, 5 - quantidade))}`;
}

function formatarPreco(preco: number): string {
  return `R$ ${preco.toFixed(2).replace('.', ',')}`;
}

// Calendários de entrada/saída e botão Alugar, usados no card e na página do hotel
function camposReserva(hotelId: number, preco: number): string {
  return `
    <div class="row g-2 mb-3">
      <div class="col-6">
        <label class="form-label small text-muted mb-1" for="entrada-${hotelId}">Data de entrada</label>
        <input type="date" id="entrada-${hotelId}" class="form-control form-control-sm" data-entrada="${hotelId}" />
      </div>
      <div class="col-6">
        <label class="form-label small text-muted mb-1" for="saida-${hotelId}">Data de saída</label>
        <input type="date" id="saida-${hotelId}" class="form-control form-control-sm" />
      </div>
    </div>
    <div class="d-flex justify-content-between align-items-center gap-2">
      <div>
        <span class="fw-bold text-primary fs-5">${formatarPreco(preco)}</span>
        <span class="small text-muted">/ diária</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="alugar(${hotelId}, this)">Alugar</button>
    </div>
  `;
}

const scriptReserva = `
        function somarDias(dataIso, dias) {
          const data = new Date(dataIso + 'T00:00:00Z');
          data.setUTCDate(data.getUTCDate() + dias);
          return data.toISOString().slice(0, 10);
        }

        // Os calendários começam com entrada hoje e saída amanhã; ao mudar a entrada,
        // a saída acompanha para continuar pelo menos um dia depois
        const hoje = new Date();
        const hojeIso = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        document.querySelectorAll('[data-entrada]').forEach((entrada) => {
          const saida = document.getElementById('saida-' + entrada.dataset.entrada);
          entrada.value = hojeIso;
          saida.value = somarDias(hojeIso, 1);
          saida.min = saida.value;

          entrada.addEventListener('change', () => {
            if (!entrada.value) return;
            const minimo = somarDias(entrada.value, 1);
            saida.min = minimo;
            if (!saida.value || saida.value < minimo) saida.value = minimo;
          });
        });

        function calcularDiarias(entrada, saida) {
          if (!entrada || !saida) return 1;
          const dias = Math.round((Date.parse(saida) - Date.parse(entrada)) / 86400000);
          return Math.max(1, dias);
        }

        function alugar(hotelId, botao) {
          const dataEntrada = document.getElementById('entrada-' + hotelId).value || undefined;
          const dataSaida = document.getElementById('saida-' + hotelId).value;
          const diarias = calcularDiarias(dataEntrada, dataSaida);

          HotelPet.exigirLogin(async (usuario) => {
            botao.disabled = true;

            try {
              await HotelPet.api('/cart/' + usuario.id, {
                method: 'POST',
                body: JSON.stringify({ hotelId, diarias, dataEntrada }),
              });
              HotelPet.aviso('Hotel adicionado ao carrinho!');
              await HotelPet.atualizarBadge();
            } catch (e) {
              HotelPet.aviso('Erro ao adicionar ao carrinho: ' + e.message, 'danger');
            } finally {
              botao.disabled = false;
            }
          });
        }
`;

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello(): Promise<string> {
    const hotels = await this.prisma.hotel.findMany({
      orderBy: { id: 'asc' },
    });

    const cards = hotels
      .map((hotel) => {
        return `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
              <a href="/hotel/${hotel.id}">
                <img src="${escapeHtml(fotoDoHotel(hotel.fotoUrl))}" class="card-img-top" alt="${escapeHtml(hotel.nome)}" style="height: 220px; object-fit: cover;" />
              </a>
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="card-title mb-0">
                    <a href="/hotel/${hotel.id}" class="text-body text-decoration-none">${escapeHtml(hotel.nome)}</a>
                  </h5>
                  <span class="text-warning">${estrelas(hotel.estrelas)}</span>
                </div>
                <p class="text-muted small mb-2">${escapeHtml(hotel.endereco)}</p>
                <p class="card-text text-secondary">${escapeHtml(hotel.descricao)}</p>
                <a href="/hotel/${hotel.id}" class="small mb-3">Ver detalhes</a>
                <div class="mt-auto">
                  ${camposReserva(hotel.id, Number(hotel.preco))}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    return layout({
      titulo: 'HotelPet',
      conteudo: `
        <div id="carouselExample" class="carousel slide rounded-4 overflow-hidden shadow-sm" data-bs-ride="carousel">
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1600&q=80" class="d-block w-100" alt="Pet banner 1" />
            </div>
            <div class="carousel-item">
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=80" class="d-block w-100" alt="Pet banner 2" />
            </div>
            <div class="carousel-item">
              <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1600&q=80" class="d-block w-100" alt="Pet banner 3" />
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Anterior</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Próximo</span>
          </button>
        </div>

        <div class="mt-5 mb-4">
          <h2 class="fw-bold">Hotéis para pets</h2>
        </div>

        <div class="row g-4">
          ${cards}
        </div>
      `,
      script: scriptReserva,
    });
  }

  async getHotel(id: number): Promise<string> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      throw new NotFoundException(`Nenhum hotel encontrado com o id ${id}`);
    }

    const preco = Number(hotel.preco);
    const especificacoes = [
      ['Classificação', `${hotel.estrelas} de 5 estrelas`],
      ['Localização', hotel.endereco],
      ['Valor da diária', formatarPreco(preco)],
    ]
      .map(
        ([nome, valor]) => `
          <li class="list-group-item d-flex justify-content-between px-0">
            <span class="text-muted">${nome}</span>
            <span>${escapeHtml(valor)}</span>
          </li>
        `,
      )
      .join('');

    return layout({
      titulo: `${hotel.nome} | HotelPet`,
      conteudo: `
        <nav class="mb-3 small"><a href="/">← Voltar para os hotéis</a></nav>
        <div class="row g-4">
          <div class="col-lg-7">
            <img src="${escapeHtml(fotoDoHotel(hotel.fotoUrl))}" class="w-100 rounded-4 shadow-sm" alt="${escapeHtml(hotel.nome)}" style="height: 420px; object-fit: cover;" />
          </div>
          <div class="col-lg-5">
            <h2 class="fw-bold mb-1">${escapeHtml(hotel.nome)}</h2>
            <div class="text-warning mb-3">${estrelas(hotel.estrelas)}</div>
            <p class="text-secondary">${escapeHtml(hotel.descricao)}</p>

            <h6 class="fw-bold mt-4">Especificações</h6>
            <ul class="list-group list-group-flush mb-4">${especificacoes}</ul>

            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body">
                ${camposReserva(hotel.id, preco)}
              </div>
            </div>
          </div>
        </div>
      `,
      script: scriptReserva,
    });
  }

  getCarrinho(): string {
    return paginaCarrinho();
  }

  getCheckout(): string {
    return paginaCheckout();
  }

  getPedido(orderId: number): string {
    return paginaPedido(orderId);
  }

  getPedidos(): string {
    return paginaPedidos();
  }
}
