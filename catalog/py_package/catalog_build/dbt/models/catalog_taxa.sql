{{ config(materialized="table") }}

select * from {{ source("catalog", "assembly_taxa") }}
union
select * from {{ source("catalog", "organism_taxa") }}
union
select * from {{ source("catalog", "outbreak_taxa") }}
