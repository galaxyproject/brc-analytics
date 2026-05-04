import { renderHook } from "@testing-library/react";
import { createElement, JSX, ReactNode } from "react";
import { GenomeContext } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/Genome/context";
import { useGenome } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/Genome/hook";
import type { Assembly } from "../../../../app/views/WorkflowInputsView/types";

describe("useGenome", () => {
  test("throws when used outside of provider", () => {
    expect(() => renderHook(() => useGenome())).toThrow(
      "useGenome must be used within a GenomeContext.Provider"
    );
  });

  test("returns context value when used within provider", () => {
    const genome = {
      accession: "GCA_000000000",
      ncbiTaxonomyId: "123",
    } as unknown as Assembly;

    const wrapper = ({ children }: { children: ReactNode }): JSX.Element =>
      createElement(GenomeContext.Provider, { value: genome }, children);

    const { result } = renderHook(() => useGenome(), { wrapper });

    expect(result.current.accession).toBe("GCA_000000000");
  });
});
