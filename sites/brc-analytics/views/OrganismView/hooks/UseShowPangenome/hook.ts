import type { Pangenome } from "@brc/apis/pangenome";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";

/**
 * Returns the pangenome bundle to show for a species — the given bundle when
 * the `pangenome` feature flag is enabled, otherwise undefined. The bundle
 * itself is computed at build time and arrives via the organism detail data.
 * Single source of truth so the organism-page tab and the Pangenome section
 * gate identically and can't drift.
 * @param pangenome - The species' pangenome bundle, when it has one.
 * @returns The pangenome bundle to show, or undefined.
 */
export function useShowPangenome(
  pangenome: Pangenome | undefined
): Pangenome | undefined {
  const isPangenomeEnabled = useFeatureFlag("pangenome");
  return isPangenomeEnabled ? pangenome : undefined;
}
