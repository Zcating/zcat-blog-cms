-- CreateTable
CREATE TABLE "token_whitelist" (
    "id" SERIAL NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" INTEGER NOT NULL,
    "device" VARCHAR(255),
    "ip" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_token_whitelist_userId" ON "token_whitelist"("userId");

-- CreateIndex
CREATE INDEX "IDX_token_whitelist_expiresAt" ON "token_whitelist"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_token_whitelist_hash" ON "token_whitelist"("tokenHash");
