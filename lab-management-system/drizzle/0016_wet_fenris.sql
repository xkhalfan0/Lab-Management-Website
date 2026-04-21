ALTER TABLE `distributions` ADD `quantity` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `distributions` ADD `unitPrice` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `distributions` ADD `totalCost` decimal(10,2) DEFAULT '0';