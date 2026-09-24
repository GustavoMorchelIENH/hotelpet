CREATE TABLE "orders" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "formaPagamento" VARCHAR(20) NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "order_items" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "nomeHotel" VARCHAR(120) NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "diarias" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
