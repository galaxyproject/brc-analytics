{{ config(materialized="table") }}

-- Alternative names for each of the catalog's organisms, merged from NCBI's
-- names.dmp and the curated synonyms in the source organisms file. Includes a row
-- for every catalog organism, with an empty list where no synonyms were found.

with curated_synonyms as (
  -- The curated synonyms are loaded as a JSON list, null where the organism
  -- specifies none
  select
    taxonomy_id,
    list_sort(list_distinct(coalesce(from_json(synonyms, '["varchar"]'), []))) as synonyms
  from {{ source("catalog_source", "organism_taxa") }}
)

select
  c.taxonomy_id,
  -- Curated synonyms come first — they're the abbreviations and colloquial names
  -- people are most likely to search by — followed by the NCBI names not already
  -- listed. Coalesce, since the aggregate is null for organisms with no NCBI names.
  list_concat(
    c.synonyms,
    coalesce(
      list(distinct n.name_txt order by n.name_txt)
        filter (not list_contains(c.synonyms, n.name_txt)),
      []
    )
  ) as synonyms
from curated_synonyms c
left join {{ source("ncbi", "taxonomy_names") }} n
  on n.tax_id = c.taxonomy_id
  -- The synonym-like name classes: names that refer to the taxon itself, as
  -- opposed to its common names, its children ('includes'), its type material,
  -- or the nomenclatural authority strings
  and n.name_class in ('synonym', 'equivalent name', 'genbank synonym')
group by c.taxonomy_id, c.synonyms
