{{ config(materialized="table") }}

-- Alternative names for each of the catalog's organisms, merged from NCBI's
-- names.dmp and the curated synonyms in the source organisms file. Includes a row
-- for every catalog organism, with an empty list where no synonyms were found.

with ncbi_synonyms as (
  select
    t.taxonomy_id,
    n.name_txt as synonym,
    -- Names from NCBI rank after the curated ones (see all_synonyms below)
    1 as source_rank
  from {{ source("catalog_source", "organism_taxa") }} t
  join {{ source("ncbi", "taxonomy_names") }} n on n.tax_id = t.taxonomy_id
  -- The synonym-like name classes: names that refer to the taxon itself, as
  -- opposed to its common names, its children ('includes'), its type material,
  -- or the nomenclatural authority strings
  where n.name_class in ('synonym', 'equivalent name', 'genbank synonym')
),

curated_synonyms as (
  select
    t.taxonomy_id,
    -- The curated synonyms are loaded as a JSON list; unnest yields no rows for the
    -- organisms that specify none, whose value is null
    unnest(from_json(t.synonyms, '["varchar"]')) as synonym,
    0 as source_rank
  from {{ source("catalog_source", "organism_taxa") }} t
),

all_synonyms as (
  -- Deduplicate across the sources, keeping each synonym's lowest source rank so
  -- that curated synonyms are listed first — they're the abbreviations and
  -- colloquial names people are most likely to search by
  select taxonomy_id, synonym, min(source_rank) as source_rank
  from (
    select taxonomy_id, synonym, source_rank from curated_synonyms
    union all
    select taxonomy_id, synonym, source_rank from ncbi_synonyms
  )
  group by taxonomy_id, synonym
)

select
  t.taxonomy_id,
  -- Coalesce, since the aggregate is null for organisms with no synonyms at all
  coalesce(
    list(s.synonym order by s.source_rank, s.synonym) filter (s.synonym is not null),
    []
  ) as synonyms
from {{ source("catalog_source", "organism_taxa") }} t
left join all_synonyms s on s.taxonomy_id = t.taxonomy_id
group by t.taxonomy_id
