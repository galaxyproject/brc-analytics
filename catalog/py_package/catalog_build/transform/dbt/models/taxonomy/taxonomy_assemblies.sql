{{ config(materialized="table") }}

select
  t.taxonomy_id,
  {% for taxonomic_level in var("taxonomic_levels") %}
  first(l.taxon_name) filter (l.rank = '{{taxonomic_level}}') as taxonomic_level_{{taxonomic_level}},
  first(l.tax_id) filter (l.rank = '{{taxonomic_level}}') as taxonomic_level_{{taxonomic_level}}_id,
  {% endfor %}
  coalesce(
    list(l.tax_id order by l.depth desc),
    []
  ) as lineage_taxonomy_ids,
  coalesce(
    first(l.common_names) filter (l.is_query_taxon),
    []
  ) as common_names
from {{ source("catalog_source", "assembly_taxa") }} t
left join {{ ref("taxonomy_lineages_with_names") }} l on l.query_tax_id = t.taxonomy_id
group by t.taxonomy_id
