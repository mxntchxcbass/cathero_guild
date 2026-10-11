CREATE TABLE `local_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`role` text NOT NULL,
	`salt` text NOT NULL,
	`hash` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `local_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`credential_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO local_credentials(id,guild_id,role,salt,hash,updated_at) SELECT guild_id||':viewer',guild_id,'viewer',salt,password_hash,updated_at FROM guild_passwords;
