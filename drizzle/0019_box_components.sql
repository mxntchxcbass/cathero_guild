WITH input(name,price,fallback) AS (VALUES
('냥혼석','500','expected-soul'),('메달 파편','1','expected-medal'),('검은 보석','1','expected-black'),('다이아 10개 환산','1','expected-diamond-bundle'),('레시피 공통 평가','20','expected-recipe'),
('초보자 목걸이','200','expected-necklace-basic'),('여행자 목걸이','2300','expected-necklace-advanced'),('하늘빛 목걸이','25000','expected-necklace-rare')),
resolved AS (SELECT *,COALESCE((SELECT item_id FROM market_prices p WHERE p.guild_id='legacy' AND p.item_name=input.name ORDER BY observed_at DESC,rowid DESC LIMIT 1),fallback) AS target FROM input)
INSERT OR IGNORE INTO market_prices(id,guild_id,item_id,item_name,unit_price,observed_at,note)
SELECT 'box-components-20261011-'||target,'legacy',target,name,price,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'사용자 검증 상자 평가 기준 · 수정 시 기댓값 자동 반영' FROM resolved;
--> statement-breakpoint
UPDATE sheet_sync SET requested=requested+1;
