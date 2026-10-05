{{ config(materialized="table", enabled=var("has_workflows", false)) }}

{{ with_merged_taxonomy_id(source("catalog_source", "workflows")) }}
