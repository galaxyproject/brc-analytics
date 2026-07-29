import type { Pangenome } from "@/apis/catalog/brc-analytics-catalog/common/pangenome";
import { API as BRC_API } from "@/services/workflows/brc/routes";
import { fetchEntities } from "@repo/shared/services/workflows/loader";
import {
  getEntitiesById,
  setEntitiesById,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";

/**
 * Loads the pangenomes store from the API, keyed by species taxonomy ID.
 * Pangenome data is optional (may be absent before its build lands), so a
 * missing or failed fetch is skipped rather than fatal.
 */
export async function loadPangenomes(): Promise<void> {
  if (getEntitiesById().has("pangenomes")) return;

  let pangenomes: Pangenome[];
  try {
    pangenomes = (await fetchEntities(BRC_API.pangenomes)) as Pangenome[];
  } catch (error) {
    // Optional data: stay non-fatal, but surface the error so a real
    // regression (vs. an intentionally-absent file) is debuggable.
    console.warn("Failed to load pangenomes; skipping.", error);
    return;
  }

  // Optional data: a malformed (non-array) 200 payload must not throw and gate
  // the core entity load.
  if (!Array.isArray(pangenomes)) return;

  const pangenomeBySpeciesTaxonomyId = new Map<string, Pangenome>();
  for (const pangenome of pangenomes) {
    pangenomeBySpeciesTaxonomyId.set(pangenome.speciesTaxonomyId, pangenome);
  }

  setEntitiesById("pangenomes", pangenomeBySpeciesTaxonomyId);
  setEntitiesByType("pangenomes", pangenomes);
}
