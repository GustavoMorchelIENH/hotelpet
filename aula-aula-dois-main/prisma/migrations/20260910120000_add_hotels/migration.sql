CREATE TABLE "hotels" (
    "id" SERIAL PRIMARY KEY,
    "nome" VARCHAR(120) NOT NULL,
    "endereco" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "estrelas" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "fotoUrl" VARCHAR(500),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "hotels" ("nome", "endereco", "descricao", "estrelas", "preco", "fotoUrl") VALUES
('Hotel Verde', 'São Paulo - SP', 'Ambiente tranquilo com área de lazer para pets e quartos confortáveis.', 5, 280.00, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80'),
('Pata Feliz', 'Rio de Janeiro - RJ', 'Hotel ideal para quem busca conforto, segurança e atendimento cuidadoso.', 4, 220.00, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80'),
('Pet Charm', 'Curitiba - PR', 'Fácil acesso, estrutura moderna e atenção especial para cada animal.', 5, 310.00, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'),
('Canino Hotel', 'Belo Horizonte - MG', 'Espaço confortável com rotina de passeio e acompanhamento constante.', 4, 240.00, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80'),
('Ninho Pet', 'Salvador - BA', 'Relação de cuidado com ambiente acolhedor e muito bem localizado.', 5, 260.00, 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'),
('Mundo Pet', 'Porto Alegre - RS', 'Estrutura premium com serviços extras para pets e tutores.', 4, 290.00, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80');
