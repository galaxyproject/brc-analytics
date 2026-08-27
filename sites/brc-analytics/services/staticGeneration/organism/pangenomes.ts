import { type Pangenome } from "@brc/apis/pangenome";
import { promises as fsp } from "fs";

// The pangenomes catalog, read at build time and embedded into each organism
// page. Repo-root-relative: site builds run from the repo root.
const PANGENOMES_STATIC_LOAD_FILE = "catalog/output/pangenomes.json";

let pangenomesPromise: Promise<Map<string, Pangenome>> | null = null;

/**
 * Reads the pangenomes catalog into a map keyed by species taxonomy ID,
 * memoized per build worker so the per-page lookup is O(1). Every failure —
 * an absent file, a malformed payload, a payload that is not an array — fails
 * the build, so a regression cannot silently ship every organism page without
 * its pangenome section.
 * @returns Pangenomes keyed by species taxonomy ID.
 */
export function loadPangenomes(): Promise<Map<string, Pangenome>> {
  pangenomesPromise ??= fsp
    .readFile(PANGENOMES_STATIC_LOAD_FILE, "utf8")
    .then((text) => {
      const pangenomes = JSON.parse(text) as Pangenome[];
      if (!Array.isArray(pangenomes))
        throw new Error(
          `Pangenomes catalog is not an array: ${PANGENOMES_STATIC_LOAD_FILE}`
        );
      return new Map(pangenomes.map((p) => [p.speciesTaxonomyId, p]));
    })
    .catch((error) => {
      // Don't cache a failed read — evict on rejection so a transient error
      // doesn't poison every subsequent page render in the same worker.
      pangenomesPromise = null;
      throw error;
    });
  return pangenomesPromise;
}
