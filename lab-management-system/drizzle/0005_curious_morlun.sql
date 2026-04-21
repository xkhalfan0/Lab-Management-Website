CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractNumber` varchar(128) NOT NULL,
	`contractName` varchar(512) NOT NULL,
	`contractorId` int NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contracts_contractNumber_unique` UNIQUE(`contractNumber`)
);
--> statement-breakpoint
ALTER TABLE `samples` MODIFY COLUMN `contractorName` varchar(256);--> statement-breakpoint
ALTER TABLE `samples` ADD `contractId` int;--> statement-breakpoint
ALTER TABLE `samples` ADD `contractNumber` varchar(128);--> statement-breakpoint
ALTER TABLE `samples` ADD `contractName` varchar(512);--> statement-breakpoint
ALTER TABLE `samples` DROP COLUMN `projectNumber`;--> statement-breakpoint
ALTER TABLE `samples` DROP COLUMN `projectName`;