{{ config(materialized="table") }}

with species_cutoff as (

    /*
      `other_names` draws on the query taxon and every ancestor up to and
      including species, so a strain's assemblies are findable by the species'
      common names. A query taxon at or above species rank has no species
      ancestor below it, so `coalesce(..., 0)` falls back to the query taxon.
    */
    select
        query_tax_id,
        coalesce(max(depth) filter (rank = 'species'), 0) as species_depth
    from {{ ref("taxonomy_lineages_with_names") }}
    group by query_tax_id

),

grouped as (

    select
        t.taxonomy_id,
        {% for taxonomic_level in var("taxonomic_levels") %}
        first(l.taxon_name order by l.tax_id) filter (l.rank = '{{taxonomic_level}}') as taxonomic_level_{{taxonomic_level}},
        first(l.tax_id order by l.tax_id) filter (l.rank = '{{taxonomic_level}}') as taxonomic_level_{{taxonomic_level}}_id,
        {% endfor %}
        list(l.tax_id order by l.depth desc) as lineage_taxonomy_ids,
        first(l.taxon_name order by l.tax_id) filter (l.is_query_taxon) as query_taxon_name,
        -- Nearest taxon first; within a taxon the name-class order set by
        -- `taxonomy_lineages_with_names` is preserved.
        flatten(
            list(l.other_names order by l.depth, l.tax_id)
            filter (l.depth <= c.species_depth)
        ) as all_other_names
    from {{ source("catalog_source", "assembly_taxa") }} t
    join {{ ref("taxonomy_lineages_with_names") }} l on l.query_tax_id = t.taxonomy_id
    join species_cutoff c on c.query_tax_id = t.taxonomy_id
    group by t.taxonomy_id

)

select
    * exclude (query_taxon_name, all_other_names),
    -- Dedup across taxa, keeping first occurrence; a name two taxa share lands
    -- at the nearer taxon's position.
    list_filter(
        all_other_names,
        (name_txt, i) ->
            i = list_position(all_other_names, name_txt)
            and name_txt is distinct from query_taxon_name
    ) as other_names
from grouped
