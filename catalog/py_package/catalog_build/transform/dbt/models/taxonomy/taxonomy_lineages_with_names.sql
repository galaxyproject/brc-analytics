{{ config(materialized="table") }}

select
  l.*,
  min(n.name_txt) filter (n.name_class = 'scientific name') as taxon_name,
  -- List different types of common names, ensuring that genbank common name comes first if present
  list_concat(
    list(n.name_txt order by n.name_txt) filter (n.name_class = 'genbank common name'),
    list(n.name_txt order by n.name_txt) filter (n.name_class in ('common name', 'acronym'))
  ) as common_names
from {{ ref("taxonomy_lineages") }} l
join {{ source("ncbi", "taxonomy_names") }} n on n.tax_id = l.tax_id
group by all
