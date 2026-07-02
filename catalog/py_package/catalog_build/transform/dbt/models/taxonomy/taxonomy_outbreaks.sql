{{ config(materialized="table") }}

select
  t.taxonomy_id,
  l.rank,
  n.name_txt as taxon_name
from {{ source("catalog", "outbreak_taxa") }} t
join {{ ref("taxonomy_lineages") }} l on l.query_tax_id = t.taxonomy_id and l.tax_id = t.taxonomy_id
join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_names") }} n on n.tax_id = t.taxonomy_id and n.name_class = 'scientific name'
