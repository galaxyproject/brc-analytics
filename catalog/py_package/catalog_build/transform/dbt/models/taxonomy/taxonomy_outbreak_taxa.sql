{{ config(materialized="ephemeral", enabled=var("has_outbreaks", false)) }}

select distinct taxonomy_id from {{ ref("catalog_input_outbreaks") }} where taxonomy_id is not null
