ALTER TABLE `test_results` ADD `managerReviewedById` int;--> statement-breakpoint
ALTER TABLE `test_results` ADD `managerReviewedByName` varchar(256);--> statement-breakpoint
ALTER TABLE `test_results` ADD `managerReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `test_results` ADD `managerNotes` text;--> statement-breakpoint
ALTER TABLE `test_results` ADD `qcReviewedById` int;--> statement-breakpoint
ALTER TABLE `test_results` ADD `qcReviewedByName` varchar(256);--> statement-breakpoint
ALTER TABLE `test_results` ADD `qcReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `test_results` ADD `qcNotes` text;