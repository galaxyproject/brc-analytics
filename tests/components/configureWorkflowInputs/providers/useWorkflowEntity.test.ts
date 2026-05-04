import { renderHook } from "@testing-library/react";
import { createElement, JSX, ReactNode } from "react";
import { WorkflowEntityContext } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/context";
import { useWorkflowEntity } from "../../../../app/components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";

describe("useWorkflowEntity", () => {
  test("throws when used outside of provider", () => {
    expect(() => renderHook(() => useWorkflowEntity())).toThrow(
      "useWorkflowEntity must be used within a WorkflowEntityContext.Provider"
    );
  });

  test("returns context value when used within provider", () => {
    const value = {
      ncbiTaxonomyId: "123",
      taxonomicLevelSpecies: "Test species",
    };

    const wrapper = ({ children }: { children: ReactNode }): JSX.Element =>
      createElement(WorkflowEntityContext.Provider, { value }, children);

    const { result } = renderHook(() => useWorkflowEntity(), { wrapper });

    expect(result.current).toEqual(value);
  });
});
