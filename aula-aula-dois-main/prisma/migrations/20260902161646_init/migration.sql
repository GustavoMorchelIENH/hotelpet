-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(67) NOT NULL,
    "sobrenome" VARCHAR(67) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(67) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
