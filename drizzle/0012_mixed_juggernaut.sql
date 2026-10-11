ALTER TABLE `sheet_sync` ADD `sheet_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX sheet_sync_sheet_id_unique ON sheet_sync(sheet_id);
--> statement-breakpoint
UPDATE sheet_sync SET sheet_id='1bpknKBic2QCJre_MWd9f1tA2luf457YbxszFD75SvzI' WHERE guild_id='legacy';
