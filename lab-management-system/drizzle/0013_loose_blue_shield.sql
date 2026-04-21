CREATE TABLE `sector_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorKey` enum('sector_1','sector_2','sector_3','sector_4','sector_5') NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(256) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sector_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `sector_accounts_sectorKey_unique` UNIQUE(`sectorKey`),
	CONSTRAINT `sector_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `sector_report_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorKey` enum('sector_1','sector_2','sector_3','sector_4','sector_5') NOT NULL,
	`reportType` enum('test_result','clearance') NOT NULL,
	`reportId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sector_report_reads_id` PRIMARY KEY(`id`)
);
