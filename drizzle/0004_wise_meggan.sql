CREATE TABLE `workspace_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`data_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guild_access` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guild_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `activity_points` ADD `guild_id` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_state` ADD `guild_id` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `item_attributes` ADD `guild_id` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `market_prices` ADD `guild_id` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `sheet_sync` ADD `guild_id` text DEFAULT 'legacy' NOT NULL;