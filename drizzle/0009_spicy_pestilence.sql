CREATE TABLE `price_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`author_id` text NOT NULL,
	`nickname` text NOT NULL,
	`item_id` text NOT NULL,
	`item_name` text NOT NULL,
	`old_price` text NOT NULL,
	`proposed_price` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text
);
