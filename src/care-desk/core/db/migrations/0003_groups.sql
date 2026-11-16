begin;

create table if not exists care_groups (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  requester_visible  boolean not null default true,
  sort_order         integer not null default 0,
  archived_at        timestamptz,
  created_at         timestamptz not null default now()
);

create unique index if not exists care_groups_name_idx on care_groups (lower(name));

insert into care_groups (name, requester_visible, sort_order) values
  ('Billing',     false, 10),
  ('Escalations', false, 20),
  ('HR',          false, 30),
  ('IT',          true,  40),
  ('Finance',     true,  50),
  ('General',     false, 60)
on conflict (lower(name)) do nothing;

commit;
