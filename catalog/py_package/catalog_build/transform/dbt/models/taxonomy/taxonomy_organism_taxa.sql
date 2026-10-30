{{ config(materialized="ephemeral") }}

select distinct taxonomy_id from {{ ref("catalog_input_organisms") }} where taxonomy_id is not null
