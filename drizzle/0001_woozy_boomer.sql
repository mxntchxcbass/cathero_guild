CREATE TABLE `activity_points` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`member_name` text NOT NULL,
	`period` text NOT NULL,
	`activity` text NOT NULL,
	`count` integer NOT NULL,
	`unit_points` integer NOT NULL,
	`points` integer NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	`voided` integer DEFAULT 0 NOT NULL
);
