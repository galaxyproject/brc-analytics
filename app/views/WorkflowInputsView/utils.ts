import {
  getGenomeIsolateText,
  getGenomeSerotypeText,
  getGenomeStrainText,
} from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import type { AssemblyContract } from "@repo/shared/apis/types";
import type { Organism } from "../OrganismView/types";

/**
 * Maps an assembly to the shared organism shape consumed by the side panel, so the
 * assembly-scoped flow can render Organism Details without an organism entity.
 * Organism-only fields (e.g. genomes) are omitted; taxonomy values absent on the
 * assembly resolve to empty arrays and are not displayed.
 * @param assembly - Assembly to derive organism-level details from.
 * @returns Organism shape for the side panel.
 */
export function mapAssemblyToOrganism(assembly: AssemblyContract): Organism {
  return {
    // Organism-level link target: the species taxon, not the assembly's own
    // (possibly strain-level) ncbiTaxonomyId.
    ncbiTaxonomyId: assembly.speciesTaxonomyId,
    priority: assembly.priority,
    priorityPathogenName: assembly.priorityPathogenName,
    taxonomicLevelIsolate: toValues(getGenomeIsolateText(assembly)),
    taxonomicLevelSerotype: toValues(getGenomeSerotypeText(assembly)),
    taxonomicLevelSpecies: assembly.taxonomicLevelSpecies,
    taxonomicLevelStrain: toValues(getGenomeStrainText(assembly)),
  };
}

/**
 * Wraps a taxonomy value in a single-element array, or an empty array when blank.
 * @param value - Taxonomy text (empty string when absent).
 * @returns The value as an array, or an empty array.
 */
function toValues(value: string): string[] {
  return value ? [value] : [];
}
