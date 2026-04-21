ALTER TABLE `clearance_requests` ADD `paymentReceiptNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `clearance_requests` ADD `sectorId` int;--> statement-breakpoint
ALTER TABLE `distributions` ADD `taskReadAt` timestamp;