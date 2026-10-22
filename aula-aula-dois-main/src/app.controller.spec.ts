import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const prisma = {
      hotel: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            nome: 'Hotel Verde',
            endereco: 'São Paulo - SP',
            descricao: 'Ambiente tranquilo e confortável para pets.',
            estrelas: 5,
            preco: 280,
            fotoUrl:
              'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          },
        ]),
      },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return an HTML page using Bootstrap with hotel data from database', async () => {
      const html = await appController.getHello();

      expect(html).toContain('bootstrap.min.css');
      expect(html).toContain('HotelPet');
      expect(html).toContain('Hotel Verde');
      expect(html).toContain('São Paulo - SP');
      expect(html).toContain('btn btn-primary btn-sm');
    });
  });

  it('should return the profile page using Bootstrap', () => {
    const html = appController.getPerfil();

    expect(html).toContain('bootstrap.min.css');
    expect(html).toContain('Meu perfil');
    expect(html).not.toContain('Carregando...');
    expect(html).not.toContain('spinner-border');
    expect(html).toContain('Salvar alterações');
    expect(html).toContain("method: 'PATCH'");
    expect(html).toContain('Calendário dos pets');
    expect(html).toContain('Cadastrar pet');
    expect(html).toContain('id="eventoModal"');
    expect(html).toContain('data-cal-data');
    expect(html).toContain(
      "document.getElementById('dias-calendario').addEventListener('click'",
    );
    expect(html).toContain(
      "bootstrap.Modal.getOrCreateInstance(document.getElementById('eventoModal')).show()",
    );
    expect(html).toContain('Adicionar ao calendário');
    expect(html).not.toContain('<h3 class="h5 fw-bold">Novo compromisso</h3>');
  });
});
