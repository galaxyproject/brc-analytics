{{ config(materialized="table") }}

select
  l.*,
  first(n.name_txt) filter (n.name_class = 'scientific name') as taxon_name,
  coalesce(list(n.name_txt) filter (n.name_class = 'common name'), []) as common_names
from {{ ref("taxonomy_lineages") }} l
join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_names") }} n on n.tax_id = l.tax_id
group by all
