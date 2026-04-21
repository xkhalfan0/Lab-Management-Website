CREATE TABLE `lab_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`distributionId` int,
	`testTypeId` int NOT NULL,
	`testTypeCode` varchar(64) NOT NULL,
	`testTypeName` varchar(256) NOT NULL,
	`formTemplate` varchar(64),
	`testSubType` varchar(64),
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) DEFAULT '0',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`sampleId` int NOT NULL,
	`contractNumber` varchar(128),
	`contractName` varchar(512),
	`contractorName` varchar(256),
	`sampleType` varchar(64),
	`location` varchar(256),
	`castingDate` timestamp,
	`notes` text,
	`createdById` int NOT NULL,
	`distributedById` int,
	`distributedAt` timestamp,
	`assignedTechnicianId` int,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('pending','distributed','in_progress','completed','reviewed','qc_passed','rejected') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_orders_orderCode_unique` UNIQUE(`orderCode`)
);
--> statement-breakpoint
ALTER TABLE `concrete_cubes` MODIFY COLUMN `withinSpec` boolean;