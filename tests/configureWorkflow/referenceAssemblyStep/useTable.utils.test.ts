import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";
import { getTableData } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/utils";

const ASSEMBLIES = [{ accession: "GCF_000002765.6" }];

describe("getTableData", () => {
  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
  });

  test("lists every assembly when the user can pick one", () => {
    setEntitiesByType("assemblies", ASSEMBLIES);

    expect(getTableData(true)).toBe(ASSEMBLIES);
  });

  test("lists no assemblies for a disabled step, without reading the assemblies list", () => {
    // The assembly analyze pages don't load the assemblies list; a disabled
    // step reading it would throw.
    expect(getTableData(false)).toEqual([]);
  });

  test("throws when the step is enabled but the assemblies list isn't loaded", () => {
    expect(() => getTableData(true)).toThrow(
      "No entities found for entity list type: assemblies"
    );
  });
});
