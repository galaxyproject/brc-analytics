{{ config(materialized="table") }}

select
  t.taxonomy_id,
  list(l.tax_id order by depth) as lineage_taxonomy_ids,
  list(l.rank order by depth) as lineage_ranks,
  list(l.taxon_name order by depth) as lineage_names,
  first(l.common_names) filter (l.is_query_taxon) as common_names
from {{ source("catalog", "assembly_taxa") }} t
join ref("taxonomy_lineages_with_names") l on l.query_tax_id = t.taxonomy_id
group by t.taxonomy_id
