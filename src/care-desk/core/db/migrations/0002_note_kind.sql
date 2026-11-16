-- CARE DESK · migration 0002 · note kind (internal vs sent-to-requester)
-- Additive. Existing rows default to 'internal'.
begin;
alter table care_ticket_notes
  add column kind text not null default 'internal';   -- internal | client
commit;
