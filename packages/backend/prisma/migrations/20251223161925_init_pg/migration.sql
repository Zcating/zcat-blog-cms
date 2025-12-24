-- CreateTable
CREATE TABLE "article" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createByUserId" INTEGER,
    "content" TEXT NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_and_article_tags" (
    "articleId" INTEGER NOT NULL,
    "articleTagId" INTEGER NOT NULL,

    CONSTRAINT "article_and_article_tags_pkey" PRIMARY KEY ("articleId","articleTagId")
);

-- CreateTable
CREATE TABLE "article_tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "albumId" INTEGER,
    "thumbnailUrl" VARCHAR(255) NOT NULL,

    CONSTRAINT "photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_album" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverId" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "photo_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salt" VARCHAR(64) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_info" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "occupation" VARCHAR(255),
    "abstract" VARCHAR(255),
    "avatar" VARCHAR(255),
    "aboutMe" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "user_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistic" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "browser" VARCHAR(255),
    "os" VARCHAR(255),
    "device" VARCHAR(255),
    "deviceId" VARCHAR(255),
    "ip" VARCHAR(45) NOT NULL,
    "pagePath" VARCHAR(500),
    "pageTitle" VARCHAR(255),
    "referrer" VARCHAR(500),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_294cb268d5d5b961739598ee49" ON "article_and_article_tags"("articleTagId");

-- CreateIndex
CREATE INDEX "IDX_54b2005ea489ec43684104f6ce" ON "article_and_article_tags"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_c043c7daa8e5141e909e1cd841" ON "article_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "REL_user_info_userId" ON "user_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "REL_system_setting_userId" ON "system_setting"("userId");

-- CreateIndex
CREATE INDEX "statistic_time_idx" ON "statistic"("time");

-- CreateIndex
CREATE INDEX "statistic_pagePath_idx" ON "statistic"("pagePath");

-- CreateIndex
CREATE INDEX "statistic_ip_idx" ON "statistic"("ip");

-- AddForeignKey
ALTER TABLE "article_and_article_tags" ADD CONSTRAINT "FK_294cb268d5d5b961739598ee49b" FOREIGN KEY ("articleTagId") REFERENCES "article_tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article_and_article_tags" ADD CONSTRAINT "FK_54b2005ea489ec43684104f6ce6" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
