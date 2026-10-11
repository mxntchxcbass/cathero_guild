UPDATE guild_state SET members_json=(
 SELECT json_group_array(json(CASE
 WHEN json_type(value,'$.totalContribution')='integer' AND json_extract(value,'$.totalContribution')>=0
 AND json_type(value,'$.t')='integer' AND json_extract(value,'$.t')>=0
 AND json_extract(value,'$.t')<=json_extract(value,'$.totalContribution')
 THEN json_set(value,'$.baselineContribution',json_extract(value,'$.totalContribution')-json_extract(value,'$.t'),'$.trophyMode','difference')
 ELSE value END)) FROM json_each(guild_state.members_json)
), revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE EXISTS(SELECT 1 FROM json_each(guild_state.members_json)
 WHERE json_type(value,'$.totalContribution')='integer' AND json_extract(value,'$.totalContribution')>=json_extract(value,'$.t') AND json_extract(value,'$.t')>=0);
