{{ config(materialized="table") }}

select
  l.*,
  first(n.name_txt) filter (n.name_class = 'scientific name') as taxon_name,
  -- List different types of common names, ensuring that genbank common name comes first if present
  list_concat(
    list(n.name_txt) filter (n.name_class = 'genbank common name'),
    list(n.name_txt) filter (n.name_class = 'common name' or n.name_class = 'acronym')
  ) as common_names
from {{ ref("taxonomy_lineages") }} l
join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_names") }} n on n.tax_id = l.tax_id
group by all
