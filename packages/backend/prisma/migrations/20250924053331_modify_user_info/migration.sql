/*
  Warnings:

  - You are about to drop the column `email` on the `user_info` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `user_info` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_info` DROP COLUMN `email`,
    DROP COLUMN `phone`,
    ADD COLUMN `contact` TEXT NULL;
