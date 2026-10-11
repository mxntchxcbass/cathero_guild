CREATE TABLE `sheet_sync` (
	`id` text PRIMARY KEY NOT NULL,
	`requested` integer NOT NULL,
	`completed` integer NOT NULL,
	`lock_token` text,
	`lock_until` integer NOT NULL,
	`last_success` text,
	`last_error` text
);
