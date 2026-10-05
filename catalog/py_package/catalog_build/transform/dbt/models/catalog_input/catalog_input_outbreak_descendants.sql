{{ config(materialized="table", enabled=var("has_outbreaks", false)) }}

with source_descendants as (
  select
    taxonomy_id as outbreak_taxonomy_id,
    unnest(
      from_json(highlight_descendant_taxonomy_ids, '"bigint[]"')
    ) as taxonomy_id
  from {{ source("catalog_source", "outbreaks") }}
)

select
  outbreak_taxonomy_id,
  coalesce(m.new_tax_id, d.taxonomy_id) as taxonomy_id,
  d.taxonomy_id as source_taxonomy_id
from source_descendants d
left join {{ source("ncbi", "taxonomy_merged") }} m on d.taxonomy_id = m.old_tax_id
