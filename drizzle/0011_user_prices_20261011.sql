WITH input(name,price,fallback_id,grade,part,category,market_group) AS (VALUES
('숙련 늑대 징표','150','price-input-20261011-wolf','숙련','','','징표'),
('숙련 해적 징표','180','price-input-20261011-pirate','숙련','','','징표'),
('숙련 요리사 징표','10','price-input-20261011-cook','숙련','','','징표'),
('숙련 고양이 징표','27','price-input-20261011-cat','숙련','','','징표'),
('초보자 신발','100','price-input-20261011-normal-shoes','일반','신발','격전지','장비'),
('초보자 모자','100','price-input-20261011-normal-hat','일반','모자','격전지','장비'),
('초보자 목도리','100','price-input-20261011-normal-scarf','일반','목도리','격전지','장비'),
('초보자 장갑','100','price-input-20261011-normal-gloves','일반','장갑','격전지','장비'),
('여행자 신발','650','price-input-20261011-advanced-shoes','고급','신발','격전지','장비'),
('여행자 모자','650','price-input-20261011-advanced-hat','고급','모자','격전지','장비'),
('여행자 목도리','650','price-input-20261011-advanced-scarf','고급','목도리','격전지','장비'),
('여행자 장갑','650','price-input-20261011-advanced-gloves','고급','장갑','격전지','장비'),
('하늘빛 신발','4500','price-input-20261011-rare-shoes','희귀','신발','격전지','장비'),
('하늘빛 모자','4500','price-input-20261011-rare-hat','희귀','모자','격전지','장비'),
('하늘빛 목도리','4500','price-input-20261011-rare-scarf','희귀','목도리','격전지','장비'),
('하늘빛 장갑','4500','price-input-20261011-rare-gloves','희귀','장갑','격전지','장비'),
('달빛 신발','23000','price-input-20261011-hero-shoes','영웅','신발','격전지','장비'),
('달빛 모자','23000','price-input-20261011-hero-hat','영웅','모자','격전지','장비'),
('달빛 목도리','23000','price-input-20261011-hero-scarf','영웅','목도리','격전지','장비'),
('달빛 장갑','23000','price-input-20261011-hero-gloves','영웅','장갑','격전지','장비')), resolved AS (
 SELECT input.*,COALESCE((SELECT p.item_id FROM market_prices p LEFT JOIN item_attributes a ON a.item_id=p.item_id AND a.guild_id='legacy'
 WHERE p.guild_id='legacy' AND (replace(p.item_name,' ','')=replace(input.name,' ','') OR replace(p.item_name,' ','')=replace('격전지'||input.name,' ','') OR (input.name='숙련 요리사 징표' AND replace(p.item_name,' ','')='숙련요리징표'))
 AND (input.market_group<>'장비' OR COALESCE(json_extract(a.attributes_json,'$.category'),'') IN ('','격전지'))
 ORDER BY p.observed_at DESC,p.rowid DESC LIMIT 1),fallback_id) AS target_id FROM input
)
INSERT OR IGNORE INTO market_prices(id,guild_id,item_id,item_name,unit_price,observed_at,note)
SELECT 'user-prices-20261011-'||target_id,'legacy',target_id,COALESCE((SELECT item_name FROM market_prices WHERE guild_id='legacy' AND item_id=target_id ORDER BY observed_at DESC,rowid DESC LIMIT 1),name),price,strftime('%Y-%m-%dT%H:%M:%fZ','now'),
CASE WHEN market_group='장비' THEN '사용자 지정 · 격전지 4부위 · 저렴할 때 기준. 영웅은 가격 편차 큼.' ELSE '사용자 지정 · 숙련 징표 시세. 견습 시세는 유지.' END FROM resolved;
--> statement-breakpoint
WITH input(name,price,fallback_id,grade,part,category,market_group) AS (VALUES
('숙련 늑대 징표','150','price-input-20261011-wolf','숙련','','','징표'),
('숙련 해적 징표','180','price-input-20261011-pirate','숙련','','','징표'),
('숙련 요리사 징표','10','price-input-20261011-cook','숙련','','','징표'),
('숙련 고양이 징표','27','price-input-20261011-cat','숙련','','','징표'),
('초보자 신발','100','price-input-20261011-normal-shoes','일반','신발','격전지','장비'),
('초보자 모자','100','price-input-20261011-normal-hat','일반','모자','격전지','장비'),
('초보자 목도리','100','price-input-20261011-normal-scarf','일반','목도리','격전지','장비'),
('초보자 장갑','100','price-input-20261011-normal-gloves','일반','장갑','격전지','장비'),
('여행자 신발','650','price-input-20261011-advanced-shoes','고급','신발','격전지','장비'),
('여행자 모자','650','price-input-20261011-advanced-hat','고급','모자','격전지','장비'),
('여행자 목도리','650','price-input-20261011-advanced-scarf','고급','목도리','격전지','장비'),
('여행자 장갑','650','price-input-20261011-advanced-gloves','고급','장갑','격전지','장비'),
('하늘빛 신발','4500','price-input-20261011-rare-shoes','희귀','신발','격전지','장비'),
('하늘빛 모자','4500','price-input-20261011-rare-hat','희귀','모자','격전지','장비'),
('하늘빛 목도리','4500','price-input-20261011-rare-scarf','희귀','목도리','격전지','장비'),
('하늘빛 장갑','4500','price-input-20261011-rare-gloves','희귀','장갑','격전지','장비'),
('달빛 신발','23000','price-input-20261011-hero-shoes','영웅','신발','격전지','장비'),
('달빛 모자','23000','price-input-20261011-hero-hat','영웅','모자','격전지','장비'),
('달빛 목도리','23000','price-input-20261011-hero-scarf','영웅','목도리','격전지','장비'),
('달빛 장갑','23000','price-input-20261011-hero-gloves','영웅','장갑','격전지','장비')), resolved AS (
 SELECT input.*,COALESCE((SELECT p.item_id FROM market_prices p LEFT JOIN item_attributes a ON a.item_id=p.item_id AND a.guild_id='legacy'
 WHERE p.guild_id='legacy' AND (replace(p.item_name,' ','')=replace(input.name,' ','') OR replace(p.item_name,' ','')=replace('격전지'||input.name,' ','') OR (input.name='숙련 요리사 징표' AND replace(p.item_name,' ','')='숙련요리징표'))
 AND (input.market_group<>'장비' OR COALESCE(json_extract(a.attributes_json,'$.category'),'') IN ('','격전지'))
 ORDER BY p.observed_at DESC,p.rowid DESC LIMIT 1),fallback_id) AS target_id FROM input
)
INSERT INTO item_attributes(item_id,guild_id,attributes_json,updated_at)
SELECT target_id,'legacy',json_object('marketGroup',market_group,'type',CASE WHEN market_group='장비' THEN '장비' ELSE '잡화' END,'grade',grade,'part',part,'category',category),strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM resolved WHERE 1
ON CONFLICT(item_id) DO UPDATE SET attributes_json=json_set(item_attributes.attributes_json,'$.marketGroup',json_extract(excluded.attributes_json,'$.marketGroup'),'$.type',json_extract(excluded.attributes_json,'$.type'),'$.grade',json_extract(excluded.attributes_json,'$.grade'),'$.part',json_extract(excluded.attributes_json,'$.part'),'$.category',json_extract(excluded.attributes_json,'$.category')),updated_at=excluded.updated_at WHERE item_attributes.guild_id='legacy';

--> statement-breakpoint
INSERT INTO sheet_sync(id,guild_id,requested,completed,lock_until) VALUES('guild','legacy',1,0,0) ON CONFLICT(id) DO UPDATE SET requested=sheet_sync.requested+1 WHERE sheet_sync.guild_id='legacy';
