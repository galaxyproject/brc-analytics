// Transitional shim for the GA2/BRC split (monorepo-split): the organism
// contract moved to a site-neutral home (app/apis/catalog/common/entities.ts)
// as OrganismContract. Importers still reference `Organism` here; migrate them,
// then remove this file.
export type { OrganismContract as Organism } from "../../apis/catalog/common/entities";
