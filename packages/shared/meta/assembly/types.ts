import type { AssemblyContract } from "@repo/shared/apis/types";

/**
 * The assembly fields its name and description are built from.
 */
export type AssemblySummary = Pick<
  AssemblyContract,
  | "accession"
  | "chromosomes"
  | "length"
  | "level"
  | "scaffoldCount"
  | "strainName"
  | "taxonomicLevelSpecies"
>;
