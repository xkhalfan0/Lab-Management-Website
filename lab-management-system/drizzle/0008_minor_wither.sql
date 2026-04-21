ALTER TABLE `clearance_requests` ADD `qcReviewedById` int;--> statement-breakpoint
ALTER TABLE `clearance_requests` ADD `qcReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `clearance_requests` ADD `qcNotes` text;