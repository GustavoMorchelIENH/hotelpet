import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

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
              <img src="${image}" class="card-img-top" alt="${hotel.nome}" style="height: 220px; object-fit: cover;" />
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="card-title mb-0">${hotel.nome}</h5>
                  <span class="text-warning">${stars}</span>
                </div>
                <p class="text-muted small mb-2">${hotel.endereco}</p>
                <p class="card-text text-secondary">${hotel.descricao}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center">
                  <span class="fw-bold text-primary fs-5">R$ ${price}</span>
                  <button class="btn btn-primary btn-sm" onclick="alugar(${hotel.id})">Alugar</button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HotelPet</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <style>
          body { background: #f5f7fb; }
          .navbar-brand { font-weight: 700; }
          .carousel-item img { height: 420px; object-fit: cover; }
        </style>
      </head>
      <body>
        <nav class="navbar navbar-light bg-white shadow-sm sticky-top">
          <div class="container">
            <a class="navbar-brand text-primary" href="#">HotelPet</a>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm">Entrar</button>
              <button class="btn btn-primary btn-sm">Cadastre-se</button>
            </div>
          </div>
        </nav>

        <main class="container py-4">
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
        </main>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
          async function alugar(hotelId) {
            const resposta = await fetch('/cart/1', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hotelId: hotelId, diarias: 1 }),
            });

            if (resposta.ok) {
              alert('Hotel adicionado ao carrinho!');
            } else {
              const erro = await resposta.json();
              alert('Erro ao adicionar ao carrinho: ' + erro.message);
            }
          }
        </script>
      </body>
      </html>
    `;
  }
}
