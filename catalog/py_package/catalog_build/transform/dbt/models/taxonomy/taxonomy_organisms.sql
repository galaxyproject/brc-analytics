{{ config(materialized="table") }}

select
  t.taxonomy_id,
  l.rank,
  l.taxon_name,
  s.synonyms
from {{ ref("taxonomy_organism_taxa") }} t
join {{ ref("taxonomy_lineages_with_names") }} l on l.query_tax_id = t.taxonomy_id and l.is_query_taxon
join {{ ref("taxonomy_organism_synonyms") }} s on s.taxonomy_id = t.taxonomy_id
