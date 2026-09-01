import { type Pangenome } from "@brc/apis/pangenome";
import { promises as fsp } from "fs";

// The pangenomes catalog, read at build time and embedded into each organism
// page. Repo-root-relative: site builds run from the repo root. Not a site
// config entry: config entities describe the site's pages, and pangenomes have
// no page of their own -- they are a section of the organism page.
const PANGENOMES_STATIC_LOAD_FILE = "catalog/output/pangenomes.json";

let pangenomesPromise: Promise<Map<string, Pangenome>> | null = null;

/**
 * Reads the pangenomes catalog into a map keyed by species taxonomy ID,
 * memoized per build worker so the per-page lookup is O(1). An unreadable or
 * unusable catalog warns and yields an empty map rather than failing: no
 * catalog build step writes this file yet, so a clean catalog/output has no
 * pangenomes to read, and an organism page without its pangenome section is
 * the page the site served before the section existed. A build outage is too
 * high a price for an optional section.
 * @returns Pangenomes keyed by species taxonomy ID, empty where unreadable.
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
      // Loud: every organism page silently losing its pangenome section is the
      // kind of regression that ships unnoticed.
      console.warn(
        `[pangenomes] Could not read ${PANGENOMES_STATIC_LOAD_FILE}; organism pages will build without their pangenome section.`,
        error
      );
      return new Map<string, Pangenome>();
    });
  return pangenomesPromise;
}
