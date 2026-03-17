-- ============================================================
-- ACE FACILITY — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Members (linked to Supabase auth users)
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  full_name   text not null,
  email       text not null unique,
  plan        text check (plan in ('Gold','Silver','Bronze')) default 'Bronze',
  sessions_per_month int default 0,
  joined_at   timestamptz default now()
);

-- Courts
create table if not exists courts (
  id      serial primary key,
  name    text not null,
  surface text check (surface in ('Hard','Clay','Indoor')),
  status  text check (status in ('available','booked','maintenance')) default 'available'
);

-- Bookings
create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  court_id         int references courts(id) on delete cascade,
  member_id        uuid references members(id) on delete set null,
  starts_at        timestamptz not null,
  duration_minutes int default 60,
  type             text check (type in ('Singles','Doubles','Lesson','Club session')),
  status           text check (status in ('confirmed','pending','cancelled','open')) default 'pending',
  created_at       timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete set null,
  description text,
  amount_cents int not null,
  status      text check (status in ('paid','outstanding','overdue')) default 'outstanding',
  due_at      timestamptz,
  created_at  timestamptz default now()
);

-- ---- Seed data -----------------------------------------------

insert into courts (name, surface, status) values
  ('Court 1','Hard','booked'),
  ('Court 2','Hard','available'),
  ('Court 3','Clay','booked'),
  ('Court 4','Clay','available'),
  ('Court 5','Indoor','maintenance'),
  ('Court 6','Hard','booked')
on conflict do nothing;

-- ---- Row Level Security -------------------------------------

alter table members  enable row level security;
alter table courts   enable row level security;
alter table bookings enable row level security;
alter table invoices enable row level security;

-- Authenticated staff can read & write everything
create policy "auth read members"  on members  for select using (auth.role() = 'authenticated');
create policy "auth write members" on members  for all    using (auth.role() = 'authenticated');

create policy "auth read courts"   on courts   for select using (auth.role() = 'authenticated');
create policy "auth write courts"  on courts   for all    using (auth.role() = 'authenticated');

create policy "auth read bookings" on bookings for select using (auth.role() = 'authenticated');
create policy "auth write bookings"on bookings for all    using (auth.role() = 'authenticated');

create policy "auth read invoices" on invoices for select using (auth.role() = 'authenticated');
create policy "auth write invoices"on invoices for all    using (auth.role() = 'authenticated');

-- Enable realtime for courts & bookings
alter publication supabase_realtime add table courts;
alter publication supabase_realtime add table bookings;
