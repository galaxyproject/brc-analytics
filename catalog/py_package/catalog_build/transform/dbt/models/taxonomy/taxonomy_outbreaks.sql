{{ config(materialized="table") }}

{% if var("has_outbreaks", false) %}
select
  t.taxonomy_id,
  l.rank,
  l.taxon_name
from {{ source("catalog", "outbreak_taxa") }} t
join {{ ref("taxonomy_lineages_with_names") }} l on l.query_tax_id = t.taxonomy_id and l.is_query_taxon
{% else %}
-- No outbreaks for this catalog; produce an empty result with the same columns
select
  cast(null as int64) as taxonomy_id,
  cast(null as varchar) as rank,
  cast(null as varchar) as taxon_name
where false
{% endif %}
