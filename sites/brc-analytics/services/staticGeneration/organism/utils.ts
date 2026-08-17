import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { type Pangenome } from "@brc/apis/pangenome";
import { config } from "@brc/config/config";
import { loadOrganismWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/utils";
import { promises as fsp } from "fs";
import { type BRCOrganismDetail } from "./types";

// The catalog build's pangenomes output; the sync-api script copies it to the
// served /api/pangenomes.json — keep the two in step if the output ever moves.
const PANGENOMES_STATIC_LOAD_FILE = "catalog/output/pangenomes.json";

let pangenomesPromise: Promise<Pangenome[]> | null = null;

/**
 * Attaches the build-computed fields the organism detail page renders — the
 * organism's compatible workflow categories and (when present) its species
 * pangenome — so the page prerenders fully without the client entity store.
 * @param organism - Organism record.
 * @returns Organism detail data.
 */
export async function augmentOrganismDetail(
  organism: BRCDataCatalogOrganism
): Promise<BRCOrganismDetail> {
  const workflowCategories = await loadOrganismWorkflowCategories(
    config,
    organism
  );
  const pangenome = (await loadPangenomes()).find(
    (p) => p.speciesTaxonomyId === organism.ncbiTaxonomyId
  );
  // Spread the pangenome conditionally: getStaticProps output must be
  // JSON-serializable, and an explicit `undefined` field is not.
  return {
    ...organism,
    ...(pangenome ? { pangenome } : {}),
    workflowCategories,
  };
}

/**
 * Reads the pangenomes catalog, memoized per build worker. An absent file is
 * expected (pangenome data is optional) and reads as empty, with a warning so
 * a real regression stays debuggable; any other failure — including a
 * malformed payload — fails the build loudly rather than silently shipping
 * every organism page without its pangenome.
 * @returns Pangenomes, or an empty list when the file is absent.
 */
function loadPangenomes(): Promise<Pangenome[]> {
  pangenomesPromise ??= fsp
    .readFile(PANGENOMES_STATIC_LOAD_FILE, "utf8")
    .then((text) => {
      const pangenomes = JSON.parse(text) as Pangenome[];
      if (!Array.isArray(pangenomes))
        throw new Error("Pangenomes catalog is not an array");
      return pangenomes;
    })
    .catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn("Pangenomes catalog not found; skipping.", error);
        return [];
      }
      pangenomesPromise = null;
      throw error;
    });
  return pangenomesPromise;
}
