# @brc-analytics/core

Shared, site-agnostic code consumed by both apps (`@brc-analytics/brc`, `@brc-analytics/ga2`).

## Contents

- Generic UI components (`BasicCell`, `ChipCell`, `Accordion`, table infrastructure, …)
- Shared view shells (`ExploreView`, `EntityView`, `WorkflowsView`, `AnalyzeView`, …)
- Data-loading services, store, query
- Shared hooks
- Shared viewModelBuilders (`buildAccession`, `buildLength`, `buildTaxonomyId`, …)
- Structural **contract types** (`WorkflowAssembly`, `OrganismEntity`, …) that each app's concrete types satisfy structurally

## Guidelines

- Code here must not import a concrete site type (`BRCDataCatalogGenome`, `GA2AssemblyEntity`) or a `BRC | GA2` union — consume the contract types instead.
- Site-branded components, home/about/roadmap views, catalog data, and build scripts belong in the owning app, not here.

Consumed via `transpilePackages: ["@brc-analytics/core"]` in each app's `next.config`.
