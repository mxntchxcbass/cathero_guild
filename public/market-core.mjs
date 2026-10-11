import {withUpperBoxRecipe} from './upper-box-rewards.mjs';
import {withPhotoBoxRecipe} from './box-rewards.mjs';
import {withPhotoArmorRecipe} from './armor-rewards.mjs';
import {resolveItemValue} from './expected-value.mjs';
export function latestCatalog(records){const map=new Map();for(const r of records){const old=map.get(r.item_id);if(!old||r.observed_at>old.observed_at)map.set(r.item_id,r)}return [...map.values()].sort((a,b)=>a.item_name.localeCompare(b.item_name,'ko'));}
export function applyMarketPrices(items,catalog){return items.map(i=>{const valued=resolveItemValue(withUpperBoxRecipe(withPhotoBoxRecipe(withPhotoArmorRecipe(i,catalog),catalog),catalog),catalog);return valued.valuation==='expected'?{...valued,kind:'market'}:valued});}
