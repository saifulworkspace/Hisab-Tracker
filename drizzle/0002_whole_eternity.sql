CREATE TABLE `money_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`personName` varchar(255) NOT NULL,
	`kind` enum('receivable_received','payable_paid') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` enum('BDT','SR') NOT NULL,
	`transactionDate` varchar(64) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `money_transactions_id` PRIMARY KEY(`id`)
);
