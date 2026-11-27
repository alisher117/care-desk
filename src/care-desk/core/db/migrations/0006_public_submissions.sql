begin;

create table public_submissions (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

create index public_submissions_ip_idx on public_submissions (ip_hash, created_at);
create index public_submissions_email_idx on public_submissions (email, created_at);

commit;