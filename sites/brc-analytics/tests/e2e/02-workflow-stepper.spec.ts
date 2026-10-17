import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { type Locator, type Page } from "@playwright/test";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { ROUTES } from "@repo/shared/routes/constants";
import { buildConfigureWorkflowUrl } from "@repo/shared/routes/utils";
import { expect, test } from "./utils/fixtures";

/**
 * Test URLs using real catalog data.
 * RNA-seq PE workflow: ASSEMBLY_ID (disabled), GENE_MODEL_URL, SANGER_READ_RUN_PAIRED.
 * ATAC-seq workflow: ASSEMBLY_ID (disabled), SANGER_READ_RUN_PAIRED.
 */

// Assembly: Trichomonas vaginalis (GCA_000002825.3).
const ASSEMBLY_ACCESSION = "GCA_000002825.3";
const ASSEMBLY_ENTITY_ID = sanitizeEntityId(ASSEMBLY_ACCESSION);

// RNA-seq PE workflow (3 steps: Reference Assembly [disabled], GTF Files, Paired-End Sequencing Data).
const RNASEQ_PE_TRS_ID =
  "workflow-github-com-iwc-workflows-rnaseq-pe-main-versions-v1-4";

// ATAC-seq workflow (2 steps: Reference Assembly [disabled], Paired-End Sequencing Data).
const ATACSEQ_TRS_ID =
  "workflow-github-com-iwc-workflows-atacseq-main-versions-v2-1";

// Bacterial Genome Assembly (Shovill): organism-scoped with taxonomyId 2
// (Bacteria), a clade with catalog organisms, so its stepper starts with the
// Organism picker. Demo-gated, hence the demo flag.
const CLADE_WORKFLOW_URL =
  "/data/workflows/workflow-github-com-iwc-workflows-bacterial-genome-assembly-main-versions-v2-0-1?demo=true";

// Step labels.
const STEP_LABELS = {
  GTF_FILES: "GTF Files",
  PAIRED_END_FASTQ: "Paired-End FASTQ Files",
  PAIRED_END_SEQUENCING: "Paired-End Sequencing Data",
  REFERENCE_ASSEMBLY: "Reference Assembly",
};

// Alert shown when none of the taxon's read runs match the workflow's filters.
const TAXONOMY_MATCH_ALERT = "No matching read runs found by Taxonomy ID";

// MUI class selectors used to locate step elements.
const MUI_STEP = ".MuiStep-root";
const MUI_STEP_CONTENT = ".MuiStepContent-root";

// Timeout for stepper content to render (data-dependent steps may load slowly).
const STEP_LOAD_TIMEOUT = 15000;

// Use the shared timeout as the default for Playwright expectations in this spec.
expect.configure({ timeout: STEP_LOAD_TIMEOUT });

/**
 * Builds an assembly configure-workflow URL for the given workflow TRS ID.
 * @param trsId - The TRS ID of the workflow.
 * @returns The configure-workflow URL.
 */
function buildAssemblyConfigureWorkflowUrl(trsId: string): string {
  return buildConfigureWorkflowUrl(
    ROUTES.CONFIGURE_WORKFLOW,
    ASSEMBLY_ENTITY_ID,
    trsId
  );
}

/**
 * Returns a locator for a MUI Step by its label text.
 * @param page - The Playwright page.
 * @param label - The step label text.
 * @returns The step locator.
 */
function getStep(page: Page, label: string): Locator {
  return page.locator(MUI_STEP, { hasText: label });
}

/**
 * Waits for the GTF step to load, then clicks Continue (or Skip This Step on error) to advance past it.
 * @param page - The Playwright page.
 * @returns The GTF step locator.
 */
async function advancePastGtfStep(page: Page): Promise<Locator> {
  const gtfStep = getStep(page, STEP_LABELS.GTF_FILES);
  await expect(gtfStep.locator(MUI_STEP_CONTENT)).toBeVisible();
  const continueButton = gtfStep.getByRole("button", {
    name: /^(Continue|Skip This Step)$/,
  });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  return gtfStep;
}

/**
 * Builds a fake ENA read run for the given taxon and library layout.
 * @param taxonomyId - Taxonomy ID of the read run.
 * @param libraryLayout - Library layout, "PAIRED" or "SINGLE".
 * @returns ENA read run.
 */
function buildReadRun(
  taxonomyId: string,
  libraryLayout: string
): Record<string, string> {
  return {
    base_count: "1000",
    description: "",
    experiment_accession: `SRX${taxonomyId}`,
    fastq_aspera: "",
    fastq_ftp:
      libraryLayout === "PAIRED"
        ? "ftp.example.org/r_1.fastq.gz;ftp.example.org/r_2.fastq.gz"
        : "ftp.example.org/r.fastq.gz",
    fastq_md5: "",
    first_created: "2024-01-01",
    instrument_model: "Illumina NovaSeq 6000",
    instrument_platform: "ILLUMINA",
    library_layout: libraryLayout,
    library_source: "GENOMIC",
    library_strategy: "WGS",
    read_count: "10",
    run_accession: `SRR${taxonomyId}`,
    sample_accession: `SRS${taxonomyId}`,
    scientific_name: "",
    study_accession: `SRP${taxonomyId}`,
    tax_id: taxonomyId,
    tax_lineage: "",
  };
}

/**
 * Fakes the ENA read-run count and search endpoints. Each taxon in the map gets
 * one read run with its library layout; any other taxon gets none.
 * @param page - The Playwright page.
 * @param layoutByTaxonomyId - Library layout of each taxon's read run.
 */
async function mockEnaReadRuns(
  page: Page,
  layoutByTaxonomyId: Map<string, string>
): Promise<void> {
  await page.route("**/ena/portal/api/**", (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("query") ?? "";
    const taxonomyId = /tax_tree\((\d+)\)/.exec(query)?.[1] ?? "";
    const libraryLayout = layoutByTaxonomyId.get(taxonomyId);
    if (url.pathname.endsWith("/count")) {
      return route.fulfill({ json: { count: libraryLayout ? "1" : "0" } });
    }
    return route.fulfill({
      json: libraryLayout ? [buildReadRun(taxonomyId, libraryLayout)] : [],
    });
  });
}

/**
 * Picks an organism from the open organism picker dialog by row position, first
 * giving its taxon a faked ENA read run with the given library layout.
 * @param page - The Playwright page.
 * @param layoutByTaxonomyId - Faked library layout of each taxon's read run.
 * @param rowIndex - Zero-based row in the picker's table.
 * @param libraryLayout - Library layout of the picked organism's read run.
 */
async function pickOrganism(
  page: Page,
  layoutByTaxonomyId: Map<string, string>,
  rowIndex: number,
  libraryLayout: string
): Promise<void> {
  const dialog = page.getByRole("dialog");
  const row = dialog
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Select" }) })
    .nth(rowIndex);
  // Columns: Action, Species, Taxonomy ID, ...
  const taxonomyId = (await row.getByRole("cell").nth(2).textContent()) ?? "";
  layoutByTaxonomyId.set(taxonomyId.trim(), libraryLayout);
  await row.getByRole("button", { name: "Select" }).click();
  await expect(dialog).toBeHidden();
}

/**
 * Re-opens the organism picker from a completed Organism step.
 * @param organismStep - The Organism step locator.
 */
async function reopenOrganismPicker(organismStep: Locator): Promise<void> {
  // The step label's Edit makes the step active; the summary's Edit then opens
  // the picker.
  await organismStep.getByRole("button", { name: "Edit" }).click();
  await organismStep.getByRole("button", { name: "Edit" }).click();
}

test.describe("Workflow Stepper", () => {
  test.describe("RNA-seq PE workflow", () => {
    const url = buildAssemblyConfigureWorkflowUrl(RNASEQ_PE_TRS_ID);

    test.beforeEach(async ({ page }) => {
      await page.goto(url);
    });

    test("should render the stepper with expected steps", async ({ page }) => {
      // Stepper container should be visible.
      const stepper = page.getByTestId("workflow-stepper");
      await expect(stepper).toBeVisible();

      // Verify all three step labels are present.
      await expect(stepper).toContainText(STEP_LABELS.REFERENCE_ASSEMBLY);
      await expect(stepper).toContainText(STEP_LABELS.GTF_FILES);
      await expect(stepper).toContainText(STEP_LABELS.PAIRED_END_SEQUENCING);
    });

    test("should show reference assembly step as completed with pre-filled accession", async ({
      page,
    }) => {
      // Reference assembly step should show accession value (auto-completed from URL).
      const refStep = getStep(page, STEP_LABELS.REFERENCE_ASSEMBLY);
      await expect(refStep).toContainText(ASSEMBLY_ACCESSION);

      // The step should not have its content expanded (it's disabled/auto-completed).
      await expect(refStep.locator(MUI_STEP_CONTENT)).not.toBeVisible();
    });

    test("should show GTF files step as the first active step", async ({
      page,
    }) => {
      // GTF step should be active (first non-disabled step).
      // The step content area should show gene model options.
      const gtfStep = getStep(page, STEP_LABELS.GTF_FILES);
      await expect(
        gtfStep.getByText("Genes and Gene Predictions")
      ).toBeVisible();
    });

    test("should show sequencing step as inactive initially", async ({
      page,
    }) => {
      const seqStep = getStep(page, STEP_LABELS.PAIRED_END_SEQUENCING);

      // Sequencing step label should be visible but content should not be expanded.
      await expect(seqStep).toBeVisible();
      await expect(seqStep.locator(MUI_STEP_CONTENT)).not.toBeVisible();
    });

    test("should advance from GTF step to sequencing step via continue button", async ({
      page,
    }) => {
      const gtfStep = await advancePastGtfStep(page);

      // After continuing, the sequencing step should become active.
      const seqStep = getStep(page, STEP_LABELS.PAIRED_END_SEQUENCING);
      await expect(seqStep.locator(MUI_STEP_CONTENT)).toBeVisible();

      // GTF step should now show as completed with an Edit button.
      await expect(gtfStep.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    test("should navigate back to GTF step via edit button after advancing", async ({
      page,
    }) => {
      const gtfStep = await advancePastGtfStep(page);

      // Now click Edit on the GTF step.
      await gtfStep.getByRole("button", { name: "Edit" }).click();

      // GTF step should be active again with content visible.
      await expect(gtfStep.locator(MUI_STEP_CONTENT)).toBeVisible();

      // Sequencing step should no longer show its content.
      const seqStep = getStep(page, STEP_LABELS.PAIRED_END_SEQUENCING);
      await expect(seqStep.locator(MUI_STEP_CONTENT)).not.toBeVisible();
    });

    test("should render the side column with configuration and workflow details", async ({
      page,
    }) => {
      // Side column uses CollapsableSection headings.
      const main = page.locator("main");
      await expect(
        main.getByRole("heading", { name: "Configuration" })
      ).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "Workflow Details" })
      ).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "Assembly Details" })
      ).toBeVisible();
    });

    test("should show launch in galaxy button as disabled initially", async ({
      page,
    }) => {
      const launchButton = page.getByTestId("launch-galaxy-button");
      await expect(launchButton).toBeVisible();
      await expect(launchButton).toBeDisabled();
      await expect(launchButton).toContainText("Launch In Galaxy");
    });
  });

  test.describe("ATAC-seq workflow", () => {
    const url = buildAssemblyConfigureWorkflowUrl(ATACSEQ_TRS_ID);

    test.beforeEach(async ({ page }) => {
      await page.goto(url);
    });

    test("should render only reference assembly and sequencing steps", async ({
      page,
    }) => {
      const stepper = page.getByTestId("workflow-stepper");
      await expect(stepper).toBeVisible();

      // ATAC-seq has ASSEMBLY_ID + SANGER_READ_RUN_PAIRED (no GTF step).
      await expect(stepper).toContainText(STEP_LABELS.REFERENCE_ASSEMBLY);
      await expect(stepper).toContainText(STEP_LABELS.PAIRED_END_SEQUENCING);

      // GTF step should not exist for this workflow.
      await expect(stepper).not.toContainText(STEP_LABELS.GTF_FILES);
    });

    test("should show sequencing step as active since reference assembly is disabled", async ({
      page,
    }) => {
      // Sequencing step should be the first active step (reference assembly is disabled).
      const seqStep = getStep(page, STEP_LABELS.PAIRED_END_SEQUENCING);
      await expect(seqStep.locator(MUI_STEP_CONTENT)).toBeVisible();
    });

    test("should show ENA and upload my data toggles in sequencing step", async ({
      page,
    }) => {
      const seqStep = getStep(page, STEP_LABELS.PAIRED_END_SEQUENCING);
      await expect(seqStep.locator(MUI_STEP_CONTENT)).toBeVisible();

      // Sequencing step should have toggle buttons for data source.
      await expect(seqStep.getByRole("button", { name: /ENA/i })).toBeVisible();
      await expect(
        seqStep.getByRole("button", { name: /Upload My Data/i })
      ).toBeVisible();
    });
  });

  test.describe("page structure", () => {
    const url = buildAssemblyConfigureWorkflowUrl(RNASEQ_PE_TRS_ID);

    test.beforeEach(async ({ page }) => {
      await page.goto(url);
    });

    test("should display configure inputs heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { level: 1, name: "Configure Inputs" })
      ).toBeVisible();
    });

    test("should display breadcrumbs with assembly and workflow context", async ({
      page,
    }) => {
      // Breadcrumbs should be visible with navigation context.
      const nav = page.locator("nav").filter({ hasText: "Assemblies" });
      await expect(nav).toBeVisible();
      await expect(nav).toContainText(ASSEMBLY_ACCESSION);
      await expect(nav).toContainText("Configure Inputs");
    });
  });
});

// Organism: Alphainfluenzavirus influenzae (2955291) with a compatible
// organism-scope workflow (influenza isolate subtyping / consensus generation).
const ORGANISM_ENTITY_ID = "2955291";
const ORGANISM_TRS_ID =
  "workflow-github-com-iwc-workflows-influenza-isolates-consensus-and-subtyping-main-versions-v0-3";

test.describe("Organism workflow route", () => {
  test("should render the configure inputs view for an organism trsId deep-link", async ({
    page,
  }) => {
    await page.goto(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_ORGANISM_WORKFLOW,
        ORGANISM_ENTITY_ID,
        ORGANISM_TRS_ID
      )
    );

    await expect(
      page.getByRole("heading", { level: 1, name: "Configure Inputs" })
    ).toBeVisible();
  });

  test("should redirect an organism workflows URL without a trsId to the organism detail page", async ({
    page,
  }) => {
    const workflowsPath = replaceParameters(
      ROUTES.CONFIGURE_ORGANISM_WORKFLOW,
      { entityId: ORGANISM_ENTITY_ID }
    );
    const organismPath = replaceParameters(ROUTES.ORGANISM, {
      entityId: ORGANISM_ENTITY_ID,
    });

    await page.goto(workflowsPath);

    await expect(page).toHaveURL(new RegExp(`${organismPath}$`));
  });
});

test.describe("Stale workflow URL", () => {
  test("should render the workflow unavailable state for an unknown assembly trsId", async ({
    page,
  }) => {
    await page.goto(buildAssemblyConfigureWorkflowUrl("not-a-real-workflow"));

    await expect(
      page.getByRole("heading", { level: 1, name: "Workflow not available" })
    ).toBeVisible();
    // The back-link target is the one thing each page configures — pin it.
    await expect(
      page.getByRole("link", { name: "View Available Workflows" })
    ).toHaveAttribute(
      "href",
      replaceParameters(ROUTES.ANALYZE_WORKFLOWS, {
        entityId: ASSEMBLY_ENTITY_ID,
      })
    );
  });

  test("should render the workflow unavailable state for an unknown organism trsId", async ({
    page,
  }) => {
    await page.goto(
      buildConfigureWorkflowUrl(
        ROUTES.CONFIGURE_ORGANISM_WORKFLOW,
        ORGANISM_ENTITY_ID,
        "not-a-real-workflow"
      )
    );

    await expect(
      page.getByRole("heading", { level: 1, name: "Workflow not available" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Available Workflows" })
    ).toHaveAttribute(
      "href",
      replaceParameters(ROUTES.ORGANISM, { entityId: ORGANISM_ENTITY_ID })
    );
  });
});

test.describe("Clade organism picker", () => {
  /**
   * Opens the clade workflow with ENA faked by the given map.
   * @param page - The Playwright page.
   * @param layoutByTaxonomyId - Faked library layout of each taxon's read run.
   * @returns The Organism step, the alert and the read-run browse button.
   */
  async function openCladeWorkflow(
    page: Page,
    layoutByTaxonomyId: Map<string, string>
  ): Promise<{
    alert: Locator;
    browseReadRuns: Locator;
    organismStep: Locator;
  }> {
    await mockEnaReadRuns(page, layoutByTaxonomyId);
    await page.goto(CLADE_WORKFLOW_URL);
    const sequencingStep = getStep(page, STEP_LABELS.PAIRED_END_FASTQ);
    return {
      alert: sequencingStep.getByText(TAXONOMY_MATCH_ALERT),
      browseReadRuns: sequencingStep.getByRole("button", {
        name: "Browse 1 Sequence",
      }),
      // The Organism step is the clade workflow's first step.
      organismStep: page.locator(MUI_STEP).first(),
    };
  }

  test("should show the taxonomy-match alert after switching to an organism with no matching read runs", async ({
    page,
  }) => {
    const layoutByTaxonomyId = new Map<string, string>();
    const { alert, browseReadRuns, organismStep } = await openCladeWorkflow(
      page,
      layoutByTaxonomyId
    );

    // Paired-end read runs match the paired-end workflow: no alert.
    await organismStep.getByRole("button", { name: "Browse" }).click();
    await pickOrganism(page, layoutByTaxonomyId, 0, "PAIRED");
    await expect(browseReadRuns).toBeVisible();
    await expect(alert).toBeHidden();

    // Single-end read runs don't match: the alert shows.
    await reopenOrganismPicker(organismStep);
    await pickOrganism(page, layoutByTaxonomyId, 1, "SINGLE");
    await expect(browseReadRuns).toBeVisible();
    await expect(alert).toBeVisible();
  });

  test("should hide the taxonomy-match alert after switching to an organism with matching read runs", async ({
    page,
  }) => {
    const layoutByTaxonomyId = new Map<string, string>();
    const { alert, browseReadRuns, organismStep } = await openCladeWorkflow(
      page,
      layoutByTaxonomyId
    );

    // Single-end read runs don't match the paired-end workflow: the alert shows.
    await organismStep.getByRole("button", { name: "Browse" }).click();
    await pickOrganism(page, layoutByTaxonomyId, 0, "SINGLE");
    await expect(browseReadRuns).toBeVisible();
    await expect(alert).toBeVisible();

    // Paired-end read runs match: the alert goes.
    await reopenOrganismPicker(organismStep);
    await pickOrganism(page, layoutByTaxonomyId, 1, "PAIRED");
    await expect(browseReadRuns).toBeVisible();
    await expect(alert).toBeHidden();
  });
});
