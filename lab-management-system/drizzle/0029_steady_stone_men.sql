ALTER TABLE `distributions` MODIFY COLUMN `testSubType` varchar(512);--> statement-breakpoint
ALTER TABLE `lab_order_items` MODIFY COLUMN `testSubType` varchar(512);--> statement-breakpoint
ALTER TABLE `samples` MODIFY COLUMN `testSubType` varchar(512);--> statement-breakpoint
ALTER TABLE `samples` MODIFY COLUMN `sampleSubType` varchar(512);