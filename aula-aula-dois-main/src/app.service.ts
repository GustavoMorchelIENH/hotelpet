import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { escapeHtml, layout } from './views/layout';
import {
  paginaCarrinho,
  paginaCheckout,
  paginaPedido,
  paginaPedidos,
} from './views/pages';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello(): Promise<string> {
    const hotels = await this.prisma.hotel.findMany({
      orderBy: { id: 'asc' },
    });

    const cards = hotels
      .map((hotel) => {
        const price = Number(hotel.preco).toFixed(2).replace('.', ',');
        const stars = `${'★'.repeat(hotel.estrelas)}${'☆'.repeat(Math.max(0, 5 - hotel.estrelas))}`;
        const image = hotel.fotoUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80';

        return `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
              <img src="${escapeHtml(image)}" class="card-img-top" alt="${escapeHtml(hotel.nome)}" style="height: 220px; object-fit: cover;" />
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="card-title mb-0">${escapeHtml(hotel.nome)}</h5>
                  <span class="text-warning">${stars}</span>
                </div>
                <p class="text-muted small mb-2">${escapeHtml(hotel.endereco)}</p>
                <p class="card-text text-secondary">${escapeHtml(hotel.descricao)}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center gap-2">
                  <div>
                    <span class="fw-bold text-primary fs-5">R$ ${price}</span>
                    <span class="small text-muted">/ diária</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <input type="number" id="diarias-${hotel.id}" class="form-control form-control-sm diarias-input" value="1" min="1" title="Diárias" />
                    <button class="btn btn-primary btn-sm" onclick="alugar(${hotel.id}, this)">Alugar</button>
                  </div>
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
      script: `
        function alugar(hotelId, botao) {
          const diarias = Math.max(1, parseInt(document.getElementById('diarias-' + hotelId).value, 10) || 1);

          HotelPet.exigirLogin(async (usuario) => {
            botao.disabled = true;

            try {
              await HotelPet.api('/cart/' + usuario.id, {
                method: 'POST',
                body: JSON.stringify({ hotelId, diarias }),
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
      `,
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
