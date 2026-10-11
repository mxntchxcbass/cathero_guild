CREATE TABLE `support_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`author_id` text NOT NULL,
	`nickname` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`answered_at` text
);
