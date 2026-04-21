CREATE TABLE `sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectorKey` varchar(64) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sectors_sectorKey_unique` UNIQUE(`sectorKey`)
);
--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `testResultId` int;--> statement-breakpoint
ALTER TABLE `samples` MODIFY COLUMN `sampleType` enum('concrete','soil','metal','asphalt','steel','aggregates') NOT NULL;--> statement-breakpoint
ALTER TABLE `samples` MODIFY COLUMN `sector` varchar(64) NOT NULL DEFAULT 'sector_1';--> statement-breakpoint
ALTER TABLE `contracts` ADD `sectorKey` varchar(32);--> statement-breakpoint
ALTER TABLE `contracts` ADD `sectorNameAr` varchar(128);--> statement-breakpoint
ALTER TABLE `contracts` ADD `sectorNameEn` varchar(128);--> statement-breakpoint
ALTER TABLE `reviews` ADD `specializedTestResultId` int;--> statement-breakpoint
ALTER TABLE `samples` ADD `sectorNameAr` varchar(128);--> statement-breakpoint
ALTER TABLE `samples` ADD `sectorNameEn` varchar(128);--> statement-breakpoint
ALTER TABLE `samples` ADD `sampleSubType` varchar(128);--> statement-breakpoint
ALTER TABLE `samples` ADD `testTypeName` varchar(256);