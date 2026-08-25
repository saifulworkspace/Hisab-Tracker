ALTER TABLE `persons` DROP INDEX `persons_name_unique`;--> statement-breakpoint
ALTER TABLE `properties` DROP INDEX `properties_name_unique`;--> statement-breakpoint
ALTER TABLE `persons` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `receivables` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `payables` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `property_payments` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `money_transactions` ADD `userId` int NULL;--> statement-breakpoint
ALTER TABLE `sheet_sync_config` ADD `userId` int NULL;--> statement-breakpoint
UPDATE `persons` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `receivables` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `payables` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `properties` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `property_payments` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `money_transactions` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
UPDATE `sheet_sync_config` SET `userId` = (SELECT id FROM (SELECT id FROM `users` WHERE `openId` = 'hwLsDQxQj7n6o4R7FutQmC' LIMIT 1) AS owner) WHERE `userId` IS NULL;--> statement-breakpoint
ALTER TABLE `persons` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `receivables` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `payables` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `property_payments` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `money_transactions` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sheet_sync_config` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `persons` ADD CONSTRAINT `persons_user_name_unique` UNIQUE(`userId`,`name`);--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_user_name_unique` UNIQUE(`userId`,`name`);--> statement-breakpoint
ALTER TABLE `sheet_sync_config` ADD CONSTRAINT `sheet_sync_config_userId_unique` UNIQUE(`userId`);
