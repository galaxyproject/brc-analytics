{{ config(materialized="table") }}

-- Collect curated names and catalog-relevant NCBI names into a single list.

with source_names as (

    select
        tax_id,
        name_txt,
        name_class as ncbi_class,
        false as is_curated
    from {{ source("ncbi", "taxonomy_names") }}
    -- Limit names to only catalog-relevant taxa, to avoid processing the entire (quite large) name list.
    where tax_id in (select tax_id from {{ ref("taxonomy_lineages") }})

    {% if var("has_curated_taxa", false) %}
    union all

    /*
      Curated names apply to the taxon they're given for and to no other, so they're
      attached at that taxon's own tax_id; the join at the end of this model discards
      any curated taxon that no lineage passes through. Taxa below rank 'species' are
      the motivating case -- the names then reach only the assemblies actually
      identified as that taxon, and the organisms grouping those assemblies.
    */
    select
        taxonomy_id as tax_id,
        unnest(from_json(other_names, '"varchar[]"')) as name_txt,
        null as ncbi_class,
        true as is_curated
    from {{ source("catalog_source", "curated_taxa") }}
    {% endif %}

),

/*
  Attach each lineage taxon's scientific name and its `other_names` -- every
  non-scientific name NCBI knows for the taxon, in one list, including categories
  such as common names and former scientific names, and with the addition of
  curated names from the catalog source.
*/

taxon_names as (

    select
        tax_id,
        min(name_txt) filter (ncbi_class = 'scientific name') as taxon_name,
        list_concat(
            list(name_txt order by name_txt) filter (ncbi_class = 'genbank common name'),
            list(name_txt order by name_txt) filter (ncbi_class in ('common name', 'acronym')),
            list(name_txt order by name_txt) filter (ncbi_class in ('equivalent name', 'synonym')),
            list(name_txt order by name_txt) filter (is_curated)
        ) as all_names
    from source_names
    group by tax_id

),

name_keys as (

    /*
      Case-folded copy of `all_names`, aligned element-for-element, so the dedup
      below can match names that differ only in capitalization without recomputing
      the lowercase names for every comparison.
    */
    select
        *,
        list_transform(all_names, name_txt -> lower(name_txt)) as all_name_keys
    from taxon_names

),

deduped_names as (

    /*
      Keeping each name's first occurrence leaves a name carried by two classes
      in the earlier group, so the concatenation order above decides the output
      order -- and, among names differing only in case, which capitalization
      survives. The taxon's own scientific name is dropped; `is distinct from`
      rather than `<>` so a taxon with no scientific name (which would make
      every comparison NULL) keeps its names instead of losing all of them.
      list_concat over empty groups yields [], never NULL, which the
      `assembly_taxonomy_has_other_names` test relies on.
    */
    select
        tax_id,
        taxon_name,
        list_filter(
            all_names,
            (name_txt, i) ->
                -- Note: case-insensitive deduplication works when per-taxon as it is here, but should
                -- be avoided when it could create discrepancies between different catalog entities.
                i = list_position(all_name_keys, lower(name_txt))
                and lower(name_txt) is distinct from lower(taxon_name)
        ) as other_names
    from name_keys

)

select
    l.*,
    n.taxon_name,
    n.other_names
from {{ ref("taxonomy_lineages") }} l
join deduped_names n on n.tax_id = l.tax_id
