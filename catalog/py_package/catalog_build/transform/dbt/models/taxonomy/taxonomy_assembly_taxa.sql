{{ config(materialized="ephemeral") }}

select distinct organism__tax_id as taxonomy_id from {{ source("ncbi_api", "genomes") }} where organism__tax_id is not null
