// Mock the step module to avoid pulling in the GTF step component.
jest.mock(
  "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/step",
  (): Record<string, unknown> => ({ STEP: { key: "geneModelUrl" } })
);

import { useConfigureGeneModel } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/hooks/UseConfigureGeneModel/hook";
import { renderHook } from "@testing-library/react";

const NO_GENE_MODELS: string[] = [];

describe("useConfigureGeneModel", () => {
  test("reconfigures the gene model when the assembly changes but the gene model URLs don't", () => {
    const onConfigure = jest.fn();
    const onValueChange = jest.fn();

    const { rerender } = renderHook(
      ({ assemblyId }: { assemblyId: string }) =>
        useConfigureGeneModel(
          assemblyId,
          NO_GENE_MODELS,
          onConfigure,
          onValueChange
        ),
      { initialProps: { assemblyId: "GCF_1.1" } }
    );

    expect(onConfigure).toHaveBeenCalledTimes(1);
    expect(onConfigure).toHaveBeenLastCalledWith({ geneModelUrl: null });

    // A different assembly with the same (empty) gene model URLs.
    rerender({ assemblyId: "GCF_2.1" });

    expect(onConfigure).toHaveBeenCalledTimes(2);
    expect(onConfigure).toHaveBeenLastCalledWith({ geneModelUrl: null });
  });

  test("does not reconfigure the gene model when nothing changes", () => {
    const onConfigure = jest.fn();
    const onValueChange = jest.fn();

    const { rerender } = renderHook(() =>
      useConfigureGeneModel(
        "GCF_1.1",
        NO_GENE_MODELS,
        onConfigure,
        onValueChange
      )
    );
    rerender();

    expect(onConfigure).toHaveBeenCalledTimes(1);
  });
});
