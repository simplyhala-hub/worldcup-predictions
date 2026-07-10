drop table if exists predictions cascade;
drop table if exists matches cascade;
drop table if exists players cascade;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table players (
  id uuid primary key default gen_random_uuid(),
  name citext not null unique,
  created_at timestamptz default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  kickoff_at timestamptz not null,
  stage text not null,
  home_team text not null,
  away_team text not null,
  allow_draw boolean default true,
  result text check (result in ('home','draw','away')),
  created_at timestamptz default now()
);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references players(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  pick text not null check (pick in ('home','draw','away')),
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

alter table players enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;

create policy "public read players" on players for select using (true);
create policy "public insert players" on players for insert with check (true);
create policy "public update players" on players for update using (true);

create policy "public read matches" on matches for select using (true);
create policy "public write matches" on matches for all using (true) with check (true);

create policy "public read predictions" on predictions for select using (true);
create policy "public write predictions" on predictions for all using (true) with check (true);

insert into matches (match_date,kickoff_at,stage,home_team,away_team,allow_draw) values
('2026-07-10','2026-07-10 22:00:00+03','Quarterfinal','Spain','Belgium',false),
('2026-07-11','2026-07-11 00:00:00+03','Quarterfinal','Norway','England',false),
('2026-07-11','2026-07-11 04:00:00+03','Quarterfinal','Winner R16 A','Winner R16 B',false),
('2026-07-14','2026-07-14 22:00:00+03','Semifinal','Winner QF1','Winner QF2',false),
('2026-07-15','2026-07-15 22:00:00+03','Semifinal','Winner QF3','Winner QF4',false),
('2026-07-18','2026-07-18 00:00:00+03','Third Place','Loser SF1','Loser SF2',false),
('2026-07-19','2026-07-19 22:00:00+03','Final','Winner SF1','Winner SF2',false);
