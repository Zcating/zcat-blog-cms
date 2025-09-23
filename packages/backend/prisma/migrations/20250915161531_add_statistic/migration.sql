-- CreateTable
CREATE TABLE `statistic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `time` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `location` VARCHAR(255) NULL,
    `browser` VARCHAR(255) NULL,
    `os` VARCHAR(255) NULL,
    `device` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NOT NULL,
    `pagePath` VARCHAR(500) NULL,
    `pageTitle` VARCHAR(255) NULL,
    `userAgent` TEXT NULL,
    `referrer` VARCHAR(500) NULL,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `statistic_time_idx`(`time`),
    INDEX `statistic_pagePath_idx`(`pagePath`),
    INDEX `statistic_ip_idx`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
