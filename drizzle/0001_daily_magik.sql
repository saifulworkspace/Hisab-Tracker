CREATE TABLE `payables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`personName` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` enum('BDT','SR') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('receivable','payable','both') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persons_id` PRIMARY KEY(`id`),
	CONSTRAINT `persons_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`budget` decimal(14,2) NOT NULL,
	`currency` enum('BDT','SR') NOT NULL DEFAULT 'BDT',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `properties_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `property_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`propertyName` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paymentDate` varchar(64) NOT NULL,
	`currency` enum('BDT','SR') NOT NULL DEFAULT 'BDT',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`personName` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` enum('BDT','SR') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receivables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sheet_sync_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKey` text,
	`spreadsheetId` text,
	`webhookUrl` text,
	`lastSyncedAt` timestamp,
	`syncStatus` varchar(64) DEFAULT 'idle',
	`lastError` text,
	CONSTRAINT `sheet_sync_config_id` PRIMARY KEY(`id`)
);
