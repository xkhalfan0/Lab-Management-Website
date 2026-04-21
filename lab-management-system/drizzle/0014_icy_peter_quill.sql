ALTER TABLE `notifications` ADD `targetRole` varchar(64);--> statement-breakpoint
ALTER TABLE `notifications` ADD `sectorId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `notificationType` varchar(64);