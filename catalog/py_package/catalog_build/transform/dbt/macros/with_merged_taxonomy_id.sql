{#
  Select all of a catalog source's columns, replacing `taxonomy_id` with the
  current NCBI tax ID where the source's ID has since been merged into another,
  and preserving the original as `source_taxonomy_id`.

  Resolving merged IDs here, at the catalog input layer, means every downstream
  model joins on current tax IDs without repeating the merged.dmp lookup, and
  the `*_tax_ids_are_latest` tests can flag source IDs that need updating.
#}
{% macro with_merged_taxonomy_id(relation) %}

select
  src.* exclude (taxonomy_id),
  coalesce(m.new_tax_id, src.taxonomy_id) as taxonomy_id,
  src.taxonomy_id as source_taxonomy_id
from {{ relation }} src
left join {{ source("ncbi", "taxonomy_merged") }} m on src.taxonomy_id = m.old_tax_id

{% endmacro %}
