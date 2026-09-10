{{ config(materialized="table") }}

/*
  Attach each lineage taxon's scientific name and its `other_names` -- every
  non-scientific name NCBI knows for the taxon, in one list, including categories
  such as common names and former scientific names.
*/

with taxon_names as (

    -- The `where` restricts the aggregate to the taxa the join below keeps;
    -- without it this groups all of names.dmp (~3M taxa) to use ~5k of them.
    select
        tax_id,
        min(name_txt) filter (name_class = 'scientific name') as taxon_name,
        list_concat(
            list(name_txt order by name_txt) filter (name_class = 'genbank common name'),
            list(name_txt order by name_txt) filter (name_class in ('common name', 'acronym')),
            list(name_txt order by name_txt) filter (name_class in ('equivalent name', 'synonym'))
        ) as all_names
    from {{ source("ncbi", "taxonomy_names") }}
    where tax_id in (select tax_id from {{ ref("taxonomy_lineages") }})
    group by tax_id

),

deduped_names as (

    /*
      Keeping each name's first occurrence leaves a name carried by two classes
      in the earlier group, so the concatenation order above decides the output
      order. The taxon's own scientific name is dropped; `is distinct from`
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
                i = list_position(all_names, name_txt)
                and name_txt is distinct from taxon_name
        ) as other_names
    from taxon_names

)

select
    l.*,
    n.taxon_name,
    n.other_names
from {{ ref("taxonomy_lineages") }} l
join deduped_names n on n.tax_id = l.tax_id
