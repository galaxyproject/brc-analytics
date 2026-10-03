{{ config(materialized="table", enabled=var("has_outbreaks", false)) }}

select
  t.taxonomy_id,
  l.rank,
  l.taxon_name
from {{ ref("taxonomy_outbreak_taxa") }} t
join {{ ref("taxonomy_lineages_with_names") }} l on l.query_tax_id = t.taxonomy_id and l.is_query_taxon
