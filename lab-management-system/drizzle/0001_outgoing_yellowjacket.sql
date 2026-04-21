CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sampleId` int NOT NULL,
	`distributionId` int,
	`uploadedById` int NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(128),
	`fileSize` int,
	`attachmentType` enum('photo','document','contractor_letter','sector_letter','payment_order','payment_receipt','test_report','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateCode` varchar(32) NOT NULL,
	`sampleId` int NOT NULL,
	`issuedById` int NOT NULL,
	`projectNumber` varchar(128) NOT NULL,
	`projectName` varchar(256),
	`contractorName` varchar(256) NOT NULL,
	`testsCompleted` json,
	`finalResults` json,
	`notes` text,
	`pdfUrl` text,
	`pdfKey` varchar(512),
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateCode_unique` UNIQUE(`certificateCode`)
);
--> statement-breakpoint
CREATE TABLE `distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`distributionCode` varchar(32) NOT NULL,
	`sampleId` int NOT NULL,
	`assignedTechnicianId` int NOT NULL,
	`assignedById` int NOT NULL,
	`testType` varchar(128) NOT NULL,
	`testName` varchar(256) NOT NULL,
	`minAcceptable` decimal(10,3),
	`maxAcceptable` decimal(10,3),
	`unit` varchar(32) DEFAULT 'MPa',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`expectedCompletionDate` timestamp,
	`notes` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `distributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `distributions_distributionCode_unique` UNIQUE(`distributionCode`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sampleId` int,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','action_required','approved','rejected','revision') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testResultId` int NOT NULL,
	`sampleId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewType` enum('manager_review','qc_review') NOT NULL,
	`decision` enum('approved','needs_revision','rejected') NOT NULL,
	`comments` text,
	`signature` text,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sample_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sampleId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`fromStatus` varchar(64),
	`toStatus` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sample_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `samples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sampleCode` varchar(32) NOT NULL,
	`projectNumber` varchar(128) NOT NULL,
	`projectName` varchar(256),
	`contractorName` varchar(256) NOT NULL,
	`sampleType` enum('concrete','soil','metal','asphalt') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`condition` enum('good','damaged','partial') NOT NULL DEFAULT 'good',
	`notes` text,
	`status` enum('received','distributed','tested','processed','reviewed','approved','qc_passed','qc_failed','clearance_issued','rejected','revision_requested') NOT NULL DEFAULT 'received',
	`receivedById` int NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `samples_id` PRIMARY KEY(`id`),
	CONSTRAINT `samples_sampleCode_unique` UNIQUE(`sampleCode`)
);
--> statement-breakpoint
CREATE TABLE `test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`distributionId` int NOT NULL,
	`sampleId` int NOT NULL,
	`technicianId` int NOT NULL,
	`rawValues` json NOT NULL,
	`unit` varchar(32) DEFAULT 'MPa',
	`testNotes` text,
	`average` decimal(10,4),
	`stdDeviation` decimal(10,4),
	`percentage` decimal(10,4),
	`minValue` decimal(10,4),
	`maxValue` decimal(10,4),
	`complianceStatus` enum('pass','fail','partial'),
	`chartsData` json,
	`status` enum('entered','processed','approved','rejected','revision_requested') NOT NULL DEFAULT 'entered',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','reception','lab_manager','technician','sample_manager','qc_inspector','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `specialty` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;