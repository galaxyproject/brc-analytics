{{ config(materialized="ephemeral") }}

select distinct taxonomy_id from {{ source("catalog_source", "organisms") }} where taxonomy_id is not null
