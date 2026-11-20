-- One duplicated id, so the unique test finds exactly one failing value.
select 1 as id, 'a' as name
union all
select 1 as id, 'b' as name
union all
select 2 as id, 'c' as name
