ALTER TABLE `specialized_test_results` ADD `managerReviewedByName` varchar(256);--> statement-breakpoint
ALTER TABLE `specialized_test_results` ADD `managerReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `specialized_test_results` ADD `managerNotes` text;--> statement-breakpoint
ALTER TABLE `specialized_test_results` ADD `qcReviewedByName` varchar(256);--> statement-breakpoint
ALTER TABLE `specialized_test_results` ADD `qcReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `specialized_test_results` ADD `qcNotes` text;