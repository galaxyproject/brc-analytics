// Mock the step module to avoid pulling in the GTF step component.
jest.mock(
  "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/step",
  (): Record<string, unknown> => ({ STEP: { key: "geneModelUrl" } })
);

import { isGeneModelCleared } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/utils";

describe("isGeneModelCleared", () => {
  test("returns true when no gene model is configured", () => {
    expect(isGeneModelCleared({})).toBe(true);
    expect(isGeneModelCleared({ geneModelUrl: undefined })).toBe(true);
    expect(isGeneModelCleared({ geneModelUrl: null })).toBe(true);
    expect(isGeneModelCleared({ geneModelUrl: "" })).toBe(true);
  });

  test("returns false when a gene model is configured", () => {
    expect(
      isGeneModelCleared({
        geneModelUrl: "https://example.org/GCF_1.1.ncbiGene.gtf.gz",
      })
    ).toBe(false);
  });
});
