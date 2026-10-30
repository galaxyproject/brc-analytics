{{ config(materialized="table", enabled=var("has_curated_taxa", false)) }}

{{ with_merged_taxonomy_id(source("catalog_source", "curated_taxa")) }}
