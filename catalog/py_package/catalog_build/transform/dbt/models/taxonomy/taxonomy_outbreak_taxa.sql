{{ config(materialized="ephemeral") }}

select distinct taxonomy_id from {{ source("catalog_source", "outbreaks") }} where taxonomy_id is not null
