{{ config(materialized="table") }}

{{ with_merged_taxonomy_id(source("catalog_source", "organisms")) }}
