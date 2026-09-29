{{ config(materialized="table") }}

with source_descendants as (
  select
    outbreak_taxonomy_id,
    unnest(highlight_descendant_taxonomy_ids) as taxonomy_id
  from {{ source("catalog_source", "outbreaks") }}
)

select
  outbreak_taxonomy_id,
  coalesce(m.new_tax_id, d.taxonomy_id) as taxonomy_id,
  d.taxonomy_id as source_taxonomy_id
from source_descendants d
left join {{ source("ncbi", "taxonomy_merged") }} m on d.taxonomy_id = m.old_tax_id
