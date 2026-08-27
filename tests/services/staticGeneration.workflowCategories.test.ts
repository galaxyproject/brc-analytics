import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  WORKFLOW_CATEGORY_ID,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  loadOrganismWorkflowCategories,
  loadWorkflowCategories,
} from "@repo/shared/services/staticGeneration/workflows/utils";
import { promises as fsp } from "fs";

jest.mock("fs", () => ({ promises: { readFile: jest.fn() } }));

const readFile = fsp.readFile as jest.MockedFunction<typeof fsp.readFile>;

const ORGANISM: OrganismContract = {
  genomes: [{ lineageTaxonomyIds: ["1", "10239", "11320"] }],
  ncbiTaxonomyId: "2955291",
  taxonomicLevelSpecies: "Alphainfluenzavirus influenzae",
};

describe("loadWorkflowCategories", () => {
  beforeEach(() => {
    readFile.mockReset();
  });

  test("reads the workflow categories from the given file", async () => {
    const categories = [buildCategory(WORKFLOW_CATEGORY_ID.VARIANT_CALLING)];
    readFile.mockResolvedValue(JSON.stringify(categories));

    await expect(loadWorkflowCategories(uniquePath())).resolves.toEqual(
      categories
    );
  });

  test("memoizes the read per file path", async () => {
    readFile.mockResolvedValue(JSON.stringify([]));
    const staticLoadFile = uniquePath();

    await Promise.all([
      loadWorkflowCategories(staticLoadFile),
      loadWorkflowCategories(staticLoadFile),
    ]);
    await loadWorkflowCategories(staticLoadFile);

    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test("throws when the payload is not an array", async () => {
    readFile.mockResolvedValue(JSON.stringify({}));
    const staticLoadFile = uniquePath();

    await expect(loadWorkflowCategories(staticLoadFile)).rejects.toThrow(
      `Workflows catalog is not an array: ${staticLoadFile}`
    );
  });

  test("evicts a rejected read so a later call re-attempts", async () => {
    readFile
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValueOnce(JSON.stringify([]));
    const staticLoadFile = uniquePath();

    await expect(loadWorkflowCategories(staticLoadFile)).rejects.toThrow(
      "read failed"
    );
    await expect(loadWorkflowCategories(staticLoadFile)).resolves.toEqual([]);

    expect(readFile).toHaveBeenCalledTimes(2);
  });
});

describe("loadOrganismWorkflowCategories", () => {
  beforeEach(() => {
    readFile.mockReset();
  });

  test("reads the workflows catalog the site config points at", async () => {
    readFile.mockResolvedValue(JSON.stringify([]));
    const staticLoadFile = uniquePath();

    await loadOrganismWorkflowCategories(buildConfig(staticLoadFile), ORGANISM);

    expect(readFile).toHaveBeenCalledWith(staticLoadFile, "utf8");
  });

  test("emits the flag-inclusive superset, including flag-gated categories", async () => {
    const categories = [
      buildCategory(WORKFLOW_CATEGORY_ID.VARIANT_CALLING),
      buildCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY),
    ];
    readFile.mockResolvedValue(JSON.stringify(categories));

    const result = await loadOrganismWorkflowCategories(
      buildConfig(uniquePath()),
      ORGANISM
    );

    expect(result.map(({ category }) => category)).toEqual([
      WORKFLOW_CATEGORY_ID.VARIANT_CALLING,
      WORKFLOW_CATEGORY_ID.ASSEMBLY,
    ]);
  });

  test("throws when the site config has no workflows entity", async () => {
    await expect(
      loadOrganismWorkflowCategories(
        () => ({ entities: [] }) as Pick<SiteConfig, "entities">,
        ORGANISM
      )
    ).rejects.toThrow("Workflows staticLoadFile not found");
  });
});

/**
 * Builds a workflow category holding a single organism-scoped workflow that is
 * compatible with any organism.
 * @param category - Workflow category ID.
 * @returns Workflow category.
 */
function buildCategory(category: WORKFLOW_CATEGORY_ID): WorkflowCategory {
  return {
    category,
    description: "desc",
    name: category,
    showComingSoon: false,
    workflows: [
      {
        assemblyCountMax: 0,
        assemblyCountMin: 0,
        iwcId: `iwc-${category}`,
        parameters: [],
        ploidy: WORKFLOW_PLOIDY.ANY,
        scope: WORKFLOW_SCOPE.ORGANISM,
        taxonomyId: null,
        trsId: `#trs-${category}`,
        workflowDescription: "organism workflow",
        workflowName: "Organism Workflow",
      } as Workflow,
    ],
  };
}

/**
 * Builds a site config accessor whose workflows entity points at the given file.
 * @param staticLoadFile - Workflows catalog file path.
 * @returns Site config accessor.
 */
function buildConfig(
  staticLoadFile: string
): () => Pick<SiteConfig, "entities"> {
  return () =>
    ({
      entities: [{ route: "workflows", staticLoadFile }],
    }) as Pick<SiteConfig, "entities">;
}

let pathCount = 0;

/**
 * Returns a file path unused by earlier tests, so each test exercises a fresh
 * entry in the path-keyed read memo.
 * @returns Workflows catalog file path.
 */
function uniquePath(): string {
  pathCount += 1;
  return `catalog/output/workflows.${pathCount}.json`;
}
