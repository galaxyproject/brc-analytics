import { renderHook } from "@testing-library/react";
import { createElement, JSX, ReactNode } from "react";
import { AssemblyContext } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/Assembly/context";
import { useAssembly } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/Assembly/hook";
import type { Assembly } from "../../../../app/views/WorkflowInputsView/types";

describe("useAssembly", () => {
  test("returns undefined when used outside of provider", () => {
    const { result } = renderHook(() => useAssembly());

    expect(result.current).toBeUndefined();
  });

  test("returns context value when used within provider", () => {
    const assembly = {
      accession: "GCA_000000000",
      ncbiTaxonomyId: "123",
    } as unknown as Assembly;

    const wrapper = ({ children }: { children: ReactNode }): JSX.Element =>
      createElement(AssemblyContext.Provider, { value: assembly }, children);

    const { result } = renderHook(() => useAssembly(), { wrapper });

    expect(result.current?.accession).toBe("GCA_000000000");
  });
});
