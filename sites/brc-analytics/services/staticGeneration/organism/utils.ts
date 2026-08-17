import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { type Pangenome } from "@brc/apis/pangenome";
import { config } from "@brc/config/config";
import { FEATURE_FLAGS } from "@brc/config/featureFlags";
import { loadWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/utils";
import { buildOrganismWorkflows } from "@repo/shared/views/OrganismView/components/Main/utils";
import { promises as fsp } from "fs";
import { type BRCOrganismDetail } from "./types";

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
  const categories = await loadWorkflowCategories(getWorkflowsStaticLoadFile());
  const workflowCategories = buildOrganismWorkflows(
    organism,
    categories,
    FEATURE_FLAGS.includes("assembly-workflows")
  );
  const pangenome = FEATURE_FLAGS.includes("pangenome")
    ? (await loadPangenomes()).find(
        (p) => p.speciesTaxonomyId === organism.ncbiTaxonomyId
      )
    : undefined;
  // Spread the pangenome conditionally: getStaticProps output must be
  // JSON-serializable, and an explicit `undefined` field is not.
  return {
    ...organism,
    ...(pangenome ? { pangenome } : {}),
    workflowCategories,
  };
}

/**
 * Returns the workflows catalog file path from the site's workflows entity
 * config, so build and runtime read the same source.
 * @returns Workflows catalog file path.
 */
function getWorkflowsStaticLoadFile(): string {
  const staticLoadFile = config().entities.find(
    ({ route }) => route === "workflows"
  )?.staticLoadFile;
  if (!staticLoadFile) throw new Error("Workflows staticLoadFile not found");
  return staticLoadFile;
}

/**
 * Reads the pangenomes catalog, memoized per build worker. Pangenome data is
 * optional (may be absent before its build lands), mirroring the runtime
 * loader's non-fatal handling.
 * @returns Pangenomes, or an empty list when the file is absent.
 */
function loadPangenomes(): Promise<Pangenome[]> {
  pangenomesPromise ??= fsp
    .readFile(PANGENOMES_STATIC_LOAD_FILE, "utf8")
    .then((text) => JSON.parse(text) as Pangenome[])
    .catch(() => []);
  return pangenomesPromise;
}
