-- Migration: bracket auto-advance.
-- Adds next_match_id/next_slot (winner -> next round) and
-- loser_next_match_id/loser_next_slot (loser -> third place match) to
-- matches, fixes the missing 4th quarterfinal, and links the whole bracket.
-- Already applied directly to the live database via Supabase SQL Editor.

alter table matches add column if not exists next_match_id uuid references matches(id);
alter table matches add column if not exists next_slot text check (next_slot in ('home','away'));
alter table matches add column if not exists loser_next_match_id uuid references matches(id);
alter table matches add column if not exists loser_next_slot text check (loser_next_slot in ('home','away'));

update matches set home_team='France', away_team='Morocco' where stage='Quarterfinal' and home_team='Winner R16 A';

insert into matches (match_date,kickoff_at,stage,home_team,away_team,allow_draw)
select '2026-07-11','2026-07-11 22:00:00+03','Quarterfinal','Argentina','Switzerland',false
where not exists (select 1 from matches where stage='Quarterfinal' and home_team='Argentina' and away_team='Switzerland');

with qf as (
  select id, row_number() over (order by kickoff_at) rn
  from matches where stage='Quarterfinal'
), sf as (
  select id, row_number() over (order by kickoff_at) rn
  from matches where stage='Semifinal'
)
update matches m
set next_match_id = sf.id,
    next_slot = case when qf.rn in (1,3) then 'home' else 'away' end
from qf join sf on sf.rn = ceil(qf.rn/2.0)
where m.id = qf.id;

with sf as (
  select id, row_number() over (order by kickoff_at) rn
  from matches where stage='Semifinal'
), fin as (
  select id from matches where stage='Final'
), third as (
  select id from matches where stage='Third Place'
)
update matches m
set next_match_id = fin.id,
    next_slot = case when sf.rn=1 then 'home' else 'away' end,
    loser_next_match_id = third.id,
    loser_next_slot = case when sf.rn=1 then 'home' else 'away' end
from sf, fin, third
where m.id = sf.id;
