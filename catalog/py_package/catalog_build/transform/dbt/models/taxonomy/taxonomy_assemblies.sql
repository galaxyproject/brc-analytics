{{ config(materialized="table") }}

with lineage_with_names as (
  select
    l.*,
    first(n.name_txt) filter (n.name_class = 'scientific name') as taxon_name,
    coalesce(list(n.name_txt) filter (n.name_class = 'common name'), []) as common_names
  from {{ ref("taxonomy_lineages") }} l
  join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_names") }} n on n.tax_id = l.tax_id
  group by all
)
select
  t.taxonomy_id,
  list(l.tax_id order by depth) as lineage_taxonomy_ids,
  list(l.rank order by depth) as lineage_ranks,
  list(l.taxon_name order by depth) as lineage_names,
  first(l.common_names) filter (l.depth = 0) as common_names
from {{ source("catalog", "assembly_taxa") }} t
join lineage_with_names l on l.query_tax_id = t.taxonomy_id
group by t.taxonomy_id
