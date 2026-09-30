{{ config(materialized="table") }}

with grouped_descendants as (
  select
    outbreak_taxonomy_id,
    list(taxonomy_id) as taxonomy_ids
  from {{ ref("catalog_input_outbreak_descendants") }}
  group by outbreak_taxonomy_id
)

select
  o.* exclude (taxonomy_id, highlight_descendant_taxonomy_ids),
  coalesce(m.new_tax_id, o.taxonomy_id) as taxonomy_id,
  o.taxonomy_id as source_taxonomy_id,
  d.taxonomy_ids as highlight_descendant_taxonomy_ids
from {{ source("catalog_source", "outbreaks") }} o
left join {{ source("ncbi", "taxonomy_merged") }} m on o.taxonomy_id = m.old_tax_id
left join grouped_descendants d on o.taxonomy_id = d.outbreak_taxonomy_id
