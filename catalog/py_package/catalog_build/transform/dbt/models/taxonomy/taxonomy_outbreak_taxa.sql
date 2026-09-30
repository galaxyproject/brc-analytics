{{ config(materialized="ephemeral") }}

select distinct taxonomy_id from {{ ref("catalog_input_outbreaks") }} where taxonomy_id is not null
