{{ config(materialized="table") }}

/*
  Walk nodes.dmp from each catalog taxid up to the root, emitting one row per
  (query taxid, ancestor taxid). The root (tax_id 1) is self-parented in the
  taxdump, so `l.tax_id <> l.parent_tax_id` halts the recursion there instead of
  looping forever. `depth` is 0 at the query taxid and increases toward the root.
*/

with recursive lineage as (

    -- anchor: each catalog taxid starts at itself
    select
        c.taxonomy_id as query_tax_id,
        n.tax_id,
        n.parent_tax_id,
        n.rank,
        0 as depth,
        true as is_query_taxon
    from {{ ref("taxonomy_catalog_taxa") }} c
    join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_nodes") }} n
        on n.tax_id = c.taxonomy_id

    union all

    -- recurse: step to the parent, stopping at the root self-loop
    select
        l.query_tax_id,
        n.tax_id,
        n.parent_tax_id,
        n.rank,
        l.depth + 1,
        false as is_query_taxon
    from lineage l
    join {{ source("ncbi_taxonomy_raw", "ncbi_taxonomy_nodes") }} n
        on n.tax_id = l.parent_tax_id
    where l.tax_id <> l.parent_tax_id

)

select
    query_tax_id,
    tax_id,
    parent_tax_id,
    rank,
    depth
from lineage
