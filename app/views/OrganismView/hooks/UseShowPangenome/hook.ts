import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import type { Pangenome } from "../../../../apis/catalog/brc-analytics-catalog/common/pangenome";
import { getPangenome } from "../../../../services/workflows/entities";

/**
 * Returns the pangenome bundle to show for a species — the bundle when the
 * `pangenome` feature flag is enabled and the species has one, otherwise
 * undefined. Single source of truth so the organism-page tab and the Pangenome
 * section gate identically and can't drift.
 * @param ncbiTaxonomyId - Organism's NCBI (species) taxonomy ID.
 * @returns The pangenome bundle to show, or undefined.
 */
export function useShowPangenome(
  ncbiTaxonomyId: string
): Pangenome | undefined {
  const isPangenomeEnabled = useFeatureFlag("pangenome");
  const pangenome = getPangenome(ncbiTaxonomyId);
  return isPangenomeEnabled ? pangenome : undefined;
}
