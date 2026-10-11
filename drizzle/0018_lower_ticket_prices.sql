WITH input(name,price) AS (VALUES ('격전지 하층 1구역 티켓','400'),('격전지 하층 2구역 티켓','2000'))
INSERT OR IGNORE INTO market_prices(id,guild_id,item_id,item_name,unit_price,observed_at,note)
SELECT 'ticket-price-20261011-'||p.item_id,'legacy',p.item_id,p.item_name,input.price,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'사용자 지정 · 하층 1층 400 / 2층 2000 블다'
FROM market_prices p JOIN input ON p.item_name=input.name
WHERE p.guild_id='legacy' AND p.rowid=(SELECT q.rowid FROM market_prices q WHERE q.guild_id='legacy' AND q.item_id=p.item_id ORDER BY q.observed_at DESC,q.rowid DESC LIMIT 1);
--> statement-breakpoint
UPDATE sheet_sync SET requested=requested+1;
