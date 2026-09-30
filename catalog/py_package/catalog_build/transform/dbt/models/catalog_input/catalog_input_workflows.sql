{{ config(materialized="table") }}

select
  w.* exclude (taxonomy_id),
  coalesce(m.new_tax_id, w.taxonomy_id) as taxonomy_id,
  w.taxonomy_id as source_taxonomy_id
from {{ source("catalog_source", "workflows") }} o
left join {{ source("ncbi", "taxonomy_merged") }} m on w.taxonomy_id = m.old_tax_id
