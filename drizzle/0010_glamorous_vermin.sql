CREATE TABLE `improvement_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`author_id` text NOT NULL,
	`nickname` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`private` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
