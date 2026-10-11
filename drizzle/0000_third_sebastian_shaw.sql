CREATE TABLE `guild_state` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`members_json` text NOT NULL,
	`payouts_json` text NOT NULL,
	`inventory_json` text NOT NULL,
	`settings_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`item_name` text NOT NULL,
	`unit_price` text NOT NULL,
	`observed_at` text NOT NULL,
	`note` text NOT NULL
);
