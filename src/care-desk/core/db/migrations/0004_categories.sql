begin;

do $$
begin
  if to_regclass('care_groups') is not null and to_regclass('care_categories') is null then
    alter table care_groups rename to care_categories;
  end if;

  if to_regclass('care_groups_pkey') is not null and to_regclass('care_categories_pkey') is null then
    alter index care_groups_pkey rename to care_categories_pkey;
  end if;

  if to_regclass('care_groups_name_idx') is not null and to_regclass('care_categories_name_idx') is null then
    alter index care_groups_name_idx rename to care_categories_name_idx;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'care_tickets'
       and column_name = 'care_group'
  ) then
    alter table care_tickets rename column care_group to care_category;
  end if;

  if to_regclass('care_tickets_group_idx') is not null and to_regclass('care_tickets_category_idx') is null then
    alter index care_tickets_group_idx rename to care_tickets_category_idx;
  end if;
end $$;

update care_events set type = 'ticket.category_changed' where type = 'ticket.group_changed';

commit;
