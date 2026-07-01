{{ config(materialized="table") }}

select distinct taxonomy_id
from (
  select taxonomy_id from {{ source("catalog", "assembly_taxa") }}
  union all
  select taxonomy_id from {{ source("catalog", "organism_taxa") }}
  union all
  select taxonomy_id from {{ source("catalog", "outbreak_taxa") }}
) t
where taxonomy_id is not null
