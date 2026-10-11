INSERT OR IGNORE INTO market_prices(id,guild_id,item_id,item_name,unit_price,observed_at,note)
SELECT 'soul-price-50-20261011-'||item_id,'legacy',item_id,item_name,'50',strftime('%Y-%m-%dT%H:%M:%fZ','now'),'사용자 확정 · 상자 냥혼석 평가액 50 블다'
FROM market_prices WHERE guild_id='legacy' AND item_name='냥혼석'
AND rowid=(SELECT p.rowid FROM market_prices p WHERE p.guild_id='legacy' AND p.item_name='냥혼석' ORDER BY p.observed_at DESC,p.rowid DESC LIMIT 1);
--> statement-breakpoint
UPDATE sheet_sync SET requested=requested+1;
