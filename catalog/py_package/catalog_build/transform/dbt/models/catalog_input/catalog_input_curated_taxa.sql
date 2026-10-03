{{ config(materialized="table", enabled=var("has_curated_taxa", false)) }}

select
  t.* exclude (taxonomy_id),
  coalesce(m.new_tax_id, t.taxonomy_id) as taxonomy_id,
  t.taxonomy_id as source_taxonomy_id
from {{ source("catalog_source", "curated_taxa") }} t
left join {{ source("ncbi", "taxonomy_merged") }} m on t.taxonomy_id = m.old_tax_id
