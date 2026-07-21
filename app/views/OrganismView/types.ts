// Transitional shim: the organism contract lives at @repo/shared/apis/types as
// OrganismContract. Importers still reference `Organism` here; migrate them,
// then remove this file.
export type { OrganismContract as Organism } from "@repo/shared/apis/types";
