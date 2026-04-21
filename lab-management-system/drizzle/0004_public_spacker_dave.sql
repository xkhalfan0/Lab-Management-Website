CREATE TABLE `contractors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameEn` varchar(256) NOT NULL,
	`nameAr` varchar(256),
	`contactPerson` varchar(128),
	`phone` varchar(32),
	`email` varchar(320),
	`address` text,
	`contractorCode` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractors_id` PRIMARY KEY(`id`),
	CONSTRAINT `contractors_contractorCode_unique` UNIQUE(`contractorCode`)
);
--> statement-breakpoint
CREATE TABLE `test_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('concrete','soil','steel','asphalt','aggregates') NOT NULL,
	`nameEn` varchar(256) NOT NULL,
	`nameAr` varchar(256),
	`code` varchar(64),
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` varchar(32) DEFAULT 'N/mm²',
	`standardRef` varchar(256),
	`formTemplate` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `test_types_code_unique` UNIQUE(`code`)
);
