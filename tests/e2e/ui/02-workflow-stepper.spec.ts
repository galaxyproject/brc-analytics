import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters.js";
import { Locator, Page } from "@playwright/test";
import { sanitizeEntityId } from "../../../app/apis/catalog/common/utils";
import { ROUTES } from "../../../routes/constants";
import { expect, test } from "../utils/fixtures";

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
  "workflow-github-com-iwc-workflows-rnaseq-pe-main-versions-v1-3";

// ATAC-seq workflow (2 steps: Reference Assembly [disabled], Paired-End Sequencing Data).
const ATACSEQ_TRS_ID =
  "workflow-github-com-iwc-workflows-atacseq-main-versions-v1-0";

// Step labels.
const STEP_LABELS = {
  GTF_FILES: "GTF Files",
  PAIRED_END_SEQUENCING: "Paired-End Sequencing Data",
  REFERENCE_ASSEMBLY: "Reference Assembly",
};

// MUI class selectors used to locate step elements.
const MUI_STEP = ".MuiStep-root";
const MUI_STEP_CONTENT = ".MuiStepContent-root";

// Timeout for stepper content to render (data-dependent steps may load slowly).
const STEP_LOAD_TIMEOUT = 15000;

// Use the shared timeout as the default for Playwright expectations in this spec.
expect.configure({ timeout: STEP_LOAD_TIMEOUT });

/**
 * Builds a configure-workflow URL for the given workflow TRS ID.
 * @param trsId - The TRS ID of the workflow.
 * @returns The configure-workflow URL.
 */
function buildConfigureWorkflowUrl(trsId: string): string {
  return replaceParameters(ROUTES.CONFIGURE_WORKFLOW, {
    entityId: ASSEMBLY_ENTITY_ID,
    trsId,
  });
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

test.describe("Workflow Stepper", () => {
  test.describe("RNA-seq PE workflow", () => {
    const url = buildConfigureWorkflowUrl(RNASEQ_PE_TRS_ID);

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
    const url = buildConfigureWorkflowUrl(ATACSEQ_TRS_ID);

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
    const url = buildConfigureWorkflowUrl(RNASEQ_PE_TRS_ID);

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
