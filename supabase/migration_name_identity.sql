-- Migration: make player NAME the identity (case-insensitive) instead of device_id.
-- Safe to run once on an existing database — it merges duplicate players that
-- were created because the old device_id-based lookup didn't recognize repeat
-- visitors, and it preserves predictions during the merge.
--
-- Run this in Supabase SQL Editor. Do NOT run schema.sql after this — that
-- script drops all tables and would wipe your data.

create extension if not exists "citext";

-- 1. Pick one canonical player per case-insensitive name (the oldest row).
create temporary table player_canonical as
select distinct on (lower(trim(name))) id as canonical_id, lower(trim(name)) as name_key
from players
order by lower(trim(name)), created_at asc;

-- 2. Map every player row to its canonical player.
create temporary table player_map as
select p.id as old_id, pc.canonical_id
from players p
join player_canonical pc on lower(trim(p.name)) = pc.name_key;

-- 3. Move duplicate players' predictions onto the canonical player where the
--    canonical player has no pick yet for that match.
update predictions pr
set user_id = pm.canonical_id
from player_map pm
where pr.user_id = pm.old_id
  and pm.old_id <> pm.canonical_id
  and not exists (
    select 1 from predictions pr2
    where pr2.user_id = pm.canonical_id and pr2.match_id = pr.match_id
  );

-- 4. Any leftover duplicate predictions conflict with a pick the canonical
--    player already has for that match — drop the duplicate (keep the
--    canonical player's existing pick).
delete from predictions pr
using player_map pm
where pr.user_id = pm.old_id
  and pm.old_id <> pm.canonical_id;

-- 5. Remove the now-empty duplicate player rows.
delete from players p
using player_map pm
where p.id = pm.old_id
  and pm.old_id <> pm.canonical_id;

-- 6. Drop device_id — no longer used for identity.
alter table players drop constraint if exists players_device_id_key;
alter table players drop column if exists device_id;

-- 7. Make name case-insensitive and unique.
alter table players alter column name type citext;
alter table players add constraint players_name_key unique (name);

drop table player_canonical;
drop table player_map;
