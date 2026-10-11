CREATE TABLE `guild_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`entity` text NOT NULL,
	`action` text NOT NULL,
	`detail_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guild_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`state_json` text NOT NULL,
	`activities_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `restore_guard` (
	`guild_id` text PRIMARY KEY NOT NULL
);

--> statement-breakpoint
CREATE TRIGGER vault_state_insert AFTER INSERT ON guild_state BEGIN INSERT INTO guild_snapshots(guild_id,state_json,activities_json,created_at) SELECT NEW.guild_id,json_object('id',NEW.id,'revision',NEW.revision,'members_json',NEW.members_json,'payouts_json',NEW.payouts_json,'inventory_json',NEW.inventory_json,'settings_json',NEW.settings_json,'updated_at',NEW.updated_at),COALESCE((SELECT json_group_array(json_object('id',a.id,'voided',a.voided)) FROM activity_points a WHERE a.guild_id=NEW.guild_id),'[]'),strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS(SELECT 1 FROM restore_guard WHERE guild_id=NEW.guild_id); INSERT INTO guild_audit(guild_id,entity,action,detail_json,created_at) VALUES(NEW.guild_id,'state','insert',json_object('members',json_array_length(NEW.members_json),'items',json_array_length(NEW.inventory_json)),strftime('%Y-%m-%dT%H:%M:%fZ','now')); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); DELETE FROM guild_audit WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_audit WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 300); END;
--> statement-breakpoint
CREATE TRIGGER vault_state_update AFTER UPDATE ON guild_state BEGIN INSERT INTO guild_snapshots(guild_id,state_json,activities_json,created_at) SELECT NEW.guild_id,json_object('id',OLD.id,'revision',OLD.revision,'members_json',OLD.members_json,'payouts_json',OLD.payouts_json,'inventory_json',OLD.inventory_json,'settings_json',OLD.settings_json,'updated_at',OLD.updated_at),COALESCE((SELECT json_group_array(json_object('id',a.id,'voided',a.voided)) FROM activity_points a WHERE a.guild_id=NEW.guild_id),'[]'),strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NOT EXISTS(SELECT 1 FROM restore_guard WHERE guild_id=NEW.guild_id); INSERT INTO guild_audit(guild_id,entity,action,detail_json,created_at) VALUES(NEW.guild_id,'state','update',json_object('membersBefore',json(OLD.members_json),'membersAfter',json(NEW.members_json),'itemsBefore',json(OLD.inventory_json),'itemsAfter',json(NEW.inventory_json),'settingsBefore',json(OLD.settings_json),'settingsAfter',json(NEW.settings_json),'historyBefore',json_array_length(OLD.payouts_json),'historyAfter',json_array_length(NEW.payouts_json)),strftime('%Y-%m-%dT%H:%M:%fZ','now')); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); DELETE FROM guild_audit WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_audit WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 300); END;
--> statement-breakpoint
CREATE TRIGGER vault_activity_backup_insert BEFORE INSERT ON activity_points BEGIN INSERT INTO guild_snapshots(guild_id,state_json,activities_json,created_at) SELECT NEW.guild_id,json_object('id',s.id,'revision',s.revision,'members_json',s.members_json,'payouts_json',s.payouts_json,'inventory_json',s.inventory_json,'settings_json',s.settings_json,'updated_at',s.updated_at),COALESCE((SELECT json_group_array(json_object('id',a.id,'voided',a.voided)) FROM activity_points a WHERE a.guild_id=NEW.guild_id),'[]'),strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM guild_state s WHERE s.guild_id=NEW.guild_id AND NOT EXISTS(SELECT 1 FROM restore_guard WHERE guild_id=NEW.guild_id); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); END;
--> statement-breakpoint
CREATE TRIGGER vault_activity_audit_insert AFTER INSERT ON activity_points BEGIN INSERT INTO guild_audit(guild_id,entity,action,detail_json,created_at) VALUES(NEW.guild_id,'activity','insert',json_object('nickname',NEW.member_name,'activity',NEW.activity,'points',NEW.points,'period',NEW.period,'voided',NEW.voided,'note',NEW.note),strftime('%Y-%m-%dT%H:%M:%fZ','now')); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); DELETE FROM guild_audit WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_audit WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 300); END;
--> statement-breakpoint
CREATE TRIGGER vault_activity_backup_update BEFORE UPDATE ON activity_points BEGIN INSERT INTO guild_snapshots(guild_id,state_json,activities_json,created_at) SELECT NEW.guild_id,json_object('id',s.id,'revision',s.revision,'members_json',s.members_json,'payouts_json',s.payouts_json,'inventory_json',s.inventory_json,'settings_json',s.settings_json,'updated_at',s.updated_at),COALESCE((SELECT json_group_array(json_object('id',a.id,'voided',a.voided)) FROM activity_points a WHERE a.guild_id=NEW.guild_id),'[]'),strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM guild_state s WHERE s.guild_id=NEW.guild_id AND NOT EXISTS(SELECT 1 FROM restore_guard WHERE guild_id=NEW.guild_id); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); END;
--> statement-breakpoint
CREATE TRIGGER vault_activity_audit_update AFTER UPDATE ON activity_points BEGIN INSERT INTO guild_audit(guild_id,entity,action,detail_json,created_at) VALUES(NEW.guild_id,'activity','update',json_object('nickname',NEW.member_name,'activity',NEW.activity,'points',NEW.points,'period',NEW.period,'voided',NEW.voided,'note',NEW.note),strftime('%Y-%m-%dT%H:%M:%fZ','now')); DELETE FROM guild_snapshots WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_snapshots WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 30); DELETE FROM guild_audit WHERE guild_id=NEW.guild_id AND id NOT IN(SELECT id FROM guild_audit WHERE guild_id=NEW.guild_id ORDER BY id DESC LIMIT 300); END;

--> statement-breakpoint
INSERT INTO guild_snapshots(guild_id,state_json,activities_json,created_at)
SELECT s.guild_id,json_object('id',s.id,'revision',s.revision,'members_json',s.members_json,'payouts_json',s.payouts_json,'inventory_json',s.inventory_json,'settings_json',s.settings_json,'updated_at',s.updated_at),COALESCE((SELECT json_group_array(json_object('id',a.id,'voided',a.voided)) FROM activity_points a WHERE a.guild_id=s.guild_id),'[]'),strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM guild_state s;
