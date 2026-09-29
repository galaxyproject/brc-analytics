{{ config(materialized="table") }}

select
  o.* exclude (taxonomy_id),
  coalesce(m.new_tax_id, o.taxonomy_id) as taxonomy_id,
  o.taxonomy_id as source_taxonomy_id
from {{ source("catalog_source", "organisms") }} o
left join {{ source("ncbi", "taxonomy_merged") }} m on o.taxonomy_id = m.old_tax_id
