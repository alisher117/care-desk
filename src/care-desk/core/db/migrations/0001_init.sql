begin;

create table care_operators (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  text not null unique,
  display_name  text,
  status        text not null default 'offline',
  created_at    timestamptz not null default now()
);

create sequence care_ticket_number_seq start 1;

create table care_tickets (
  id                    uuid primary key default gen_random_uuid(),
  number                bigint not null unique default nextval('care_ticket_number_seq'),
  requester_id          text not null,
  requester_name        text not null,
  requester_email       text,
  requester_phone       text,
  requester_profile     jsonb,
  subject               text not null,
  description           text not null,
  priority              text not null default 'medium',
  care_group            text,
  status                text not null default 'open',
  assigned_operator_id  uuid references care_operators(id),
  due_date              timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  first_action_at       timestamptz,
  resolved_at           timestamptz,
  closed_at             timestamptz
);

create table care_ticket_notes (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references care_tickets(id),
  operator_id  uuid not null references care_operators(id),
  body         text not null,
  created_at   timestamptz not null default now()
);

create table care_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references care_tickets(id),
  type        text not null,
  actor_type  text not null,
  actor_id    text,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index care_tickets_status_idx   on care_tickets (status, updated_at desc);
create index care_tickets_priority_idx on care_tickets (priority);
create index care_tickets_group_idx    on care_tickets (care_group);
create index care_tickets_operator_idx on care_tickets (assigned_operator_id);
create index care_tickets_created_idx  on care_tickets (created_at);
create index care_ticket_notes_idx     on care_ticket_notes (ticket_id, created_at);
create index care_events_ticket_idx    on care_events (ticket_id, created_at);

commit;
