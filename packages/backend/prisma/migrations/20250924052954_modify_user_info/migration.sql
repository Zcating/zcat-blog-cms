/*
  Warnings:

  - You are about to drop the column `address` on the `user_info` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_info` DROP COLUMN `address`,
    ADD COLUMN `abstract` VARCHAR(255) NULL,
    ADD COLUMN `avatar` VARCHAR(255) NULL,
    ADD COLUMN `occupation` VARCHAR(255) NULL;
