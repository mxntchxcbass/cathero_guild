import {upperBoxes,upperBoxId,upperBoxRecipe} from '../public/upper-box-rewards.mjs';
import {photoBoxRecipe,factionBoxId} from '../public/box-rewards.mjs';
import {evaluateRewards} from '../public/expected-value.mjs';
import {inferredAttributes} from '../public/item-attributes.mjs';
import {database,rawDatabase} from '../db/raw';
import {applyMarketPrices} from '../public/market-core.mjs';
export async function getCatalog(){const r=await database().prepare('SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY observed_at DESC, rowid DESC) AS rank FROM market_prices) WHERE rank=1 ORDER BY item_name').all();const meta=await getAttributes();const items=r.results.map((p:any)=>({...p,attributes:inferredAttributes(p.item_name,meta.get(String(p.item_id))||{})}));const base=items.filter((p:any)=>!String(p.item_id).startsWith('shared-faction-box-expected')&&!String(p.item_id).startsWith('shared-upper-box-expected'));
 for(const [id,name,recipe] of [...['음식','고양이','해적','늑대'].map(f=>[factionBoxId(f),f+' 상자 공용 기댓값',photoBoxRecipe(f,base)]),...upperBoxes.map(([color,name,part])=>[upperBoxId(color,part),name,upperBoxRecipe(color,part)])] as any[]){
 const price=Math.round(evaluateRewards(recipe,base).price),previous=items.find((p:any)=>p.item_id===id);
 const observed=previous&&Number(previous.unit_price)===price?previous.observed_at:new Date().toISOString();
 if(!previous||Number(previous.unit_price)!==price)await rawDatabase().prepare("INSERT INTO market_prices(id,guild_id,item_id,item_name,unit_price,observed_at,note) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET unit_price=excluded.unit_price,observed_at=excluded.observed_at,note=excluded.note").bind(id,'legacy',id,name,String(price),observed,'검증한 확률 × 시세 DB 단가 · 미등록 가치 0, 확률 유지').run();
 base.push({item_id:id,item_name:name,unit_price:String(price),observed_at:observed,attributes:inferredAttributes(name,{})});
 }
 return base;}
export async function resolveInventory(items:any[]){return applyMarketPrices(items,await getCatalog());}

export async function getAttributes(){const rows=await database().prepare('SELECT * FROM item_attributes').all<{item_id:string,attributes_json:string}>();return new Map(rows.results.map(r=>[r.item_id,JSON.parse(r.attributes_json)]));}
