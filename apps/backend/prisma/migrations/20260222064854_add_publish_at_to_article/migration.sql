-- AlterTable
ALTER TABLE "article" ADD COLUMN     "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing data
UPDATE "article" SET "publishAt" = "createdAt";

-- CreateIndex
CREATE INDEX "article_publishAt_idx" ON "article"("publishAt");
