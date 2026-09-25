{{ config(materialized="ephemeral") }}

select distinct taxonomy_id from (
  select from_json(organism, '{"tax_id": "bigint"}').tax_id as taxonomy_id from {{ source("ncbi_api", "genomes") }}
) g(taxonomy_id) where taxonomy_id is not null
