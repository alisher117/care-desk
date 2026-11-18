-- HOST · migration 0001 · auth (dashboard users and invites)
begin;

create table users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  password_hash text not null,
  role          text not null default 'operator' check (role in ('operator', 'admin')),
  created_at    timestamptz not null default now()
);

create unique index users_email_lower_idx on users (lower(email));

create table invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text not null default 'operator' check (role in ('operator', 'admin')),
  token_hash  text not null unique,
  invited_by  uuid not null references users (id),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

commit;