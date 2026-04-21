ALTER TABLE `clearance_requests` ADD `qcReadAt` timestamp;--> statement-breakpoint
ALTER TABLE `clearance_requests` ADD `accountantReadAt` timestamp;--> statement-breakpoint
ALTER TABLE `samples` ADD `managerReadAt` timestamp;