export function questionVisibility(guildId,userId,isAdmin){return {sql:'guild_id=? AND (private=0 OR author_id=? OR ?=1)',values:[guildId,userId,isAdmin?1:0]}}
