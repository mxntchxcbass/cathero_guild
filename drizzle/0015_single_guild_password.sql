INSERT INTO local_credentials(id,guild_id,role,salt,hash,updated_at)
SELECT guild_id||':owner',guild_id,'owner',salt,hash,updated_at FROM local_credentials WHERE role='viewer'
ON CONFLICT(id) DO UPDATE SET salt=excluded.salt,hash=excluded.hash,updated_at=excluded.updated_at;
--> statement-breakpoint
DELETE FROM local_credentials WHERE role='viewer';
