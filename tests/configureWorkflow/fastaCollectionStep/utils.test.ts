import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { Workflow } from "@repo/shared/apis/workflow";
import { type Assembly } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/AssembliesSelector/hooks/UseTable/types";
import {
  buildColumns,
  canSelectAssembly,
  getAssemblySelectionValidation,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/AssembliesSelector/hooks/UseTable/utils";
import {
  buildRowSelection,
  getAddSelectionValidation,
  getFastaCollectionData,
  renderButtonText,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/AssembliesSelector/utils";
import { renderAssemblyRequirement } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/DataSelector/utils";
import {
  getFastaCollectionLabel,
  hasEnoughAssemblies,
  isFastaCollectionConfigured,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";
import { type Row, type Table } from "@tanstack/react-table";

const WORKFLOW = {
  assemblyCountMax: null,
  assemblyCountMin: 2,
  parameters: [
    {
      key: "Unaligned sequences",
      variable: WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION,
    },
  ],
} as unknown as Workflow;

const SELECTED_ROW = { getIsSelected: () => true } as Row<Assembly>;
const UNSELECTED_ROW = { getIsSelected: () => false } as Row<Assembly>;

describe("hasEnoughAssemblies", () => {
  test("returns false below the workflow's minimum", () => {
    expect(hasEnoughAssemblies(0, WORKFLOW)).toBe(false);
    expect(hasEnoughAssemblies(1, WORKFLOW)).toBe(false);
  });

  test("returns true at or above the workflow's minimum", () => {
    expect(hasEnoughAssemblies(2, WORKFLOW)).toBe(true);
    expect(hasEnoughAssemblies(5, WORKFLOW)).toBe(true);
  });
});

describe("isFastaCollectionConfigured", () => {
  test("returns false when no assemblies are configured", () => {
    expect(isFastaCollectionConfigured({}, WORKFLOW)).toBe(false);
    expect(
      isFastaCollectionConfigured({ fastaCollection: null }, WORKFLOW)
    ).toBe(false);
    expect(isFastaCollectionConfigured({ fastaCollection: [] }, WORKFLOW)).toBe(
      false
    );
  });

  test("returns false when fewer than the minimum are configured", () => {
    expect(
      isFastaCollectionConfigured({ fastaCollection: ["GCF_1.1"] }, WORKFLOW)
    ).toBe(false);
  });

  test("returns false when more than the maximum are configured", () => {
    expect(
      isFastaCollectionConfigured(
        { fastaCollection: ["GCF_1.1", "GCF_2.1", "GCF_3.1"] },
        { ...WORKFLOW, assemblyCountMax: 2 }
      )
    ).toBe(false);
  });

  test("returns true when the minimum is configured", () => {
    expect(
      isFastaCollectionConfigured(
        { fastaCollection: ["GCF_1.1", "GCF_2.1"] },
        WORKFLOW
      )
    ).toBe(true);
  });
});

describe("getFastaCollectionLabel", () => {
  test("returns undefined when no assemblies are configured", () => {
    expect(getFastaCollectionLabel({})).toBeUndefined();
    expect(getFastaCollectionLabel({ fastaCollection: [] })).toBeUndefined();
  });

  test("returns the configured count", () => {
    expect(getFastaCollectionLabel({ fastaCollection: ["GCF_1.1"] })).toBe(
      "1 assembly"
    );
    expect(
      getFastaCollectionLabel({ fastaCollection: ["GCF_1.1", "GCF_2.1"] })
    ).toBe("2 assemblies");
  });
});

describe("renderAssemblyRequirement", () => {
  test("states the minimum when there is no maximum", () => {
    expect(renderAssemblyRequirement(WORKFLOW)).toBe(
      "Browse to find and select at least 2 assemblies"
    );
  });

  test("states the range when there is a maximum", () => {
    expect(
      renderAssemblyRequirement({ ...WORKFLOW, assemblyCountMax: 5 })
    ).toBe("Browse to find and select 2 to 5 assemblies");
  });

  test("states the exact count when the minimum and maximum match", () => {
    expect(
      renderAssemblyRequirement({ ...WORKFLOW, assemblyCountMax: 2 })
    ).toBe("Browse to find and select 2 assemblies");
  });
});

describe("canSelectAssembly", () => {
  test("allows any row while the maximum isn't reached", () => {
    expect(canSelectAssembly(SELECTED_ROW, false)).toBe(true);
    expect(canSelectAssembly(UNSELECTED_ROW, false)).toBe(true);
  });

  test("allows only selected rows once the maximum is reached", () => {
    expect(canSelectAssembly(SELECTED_ROW, true)).toBe(true);
    expect(canSelectAssembly(UNSELECTED_ROW, true)).toBe(false);
  });
});

describe("getAssemblySelectionValidation", () => {
  test("returns undefined for a row that can be selected", () => {
    expect(getAssemblySelectionValidation(UNSELECTED_ROW, false, 3)).toBe(
      undefined
    );
    expect(getAssemblySelectionValidation(SELECTED_ROW, true, 3)).toBe(
      undefined
    );
  });

  test("explains the maximum for a row blocked by it", () => {
    expect(getAssemblySelectionValidation(UNSELECTED_ROW, true, 3)).toBe(
      "Up to 3 assemblies can be selected"
    );
  });

  test("never blocks a row when the workflow has no maximum", () => {
    expect(
      getAssemblySelectionValidation(UNSELECTED_ROW, false, null)
    ).toBeUndefined();
  });
});

describe("buildColumns", () => {
  test("leads with the row selection column", () => {
    expect(buildColumns(null)[0].id).toBe(COLUMN_IDENTIFIER.ROW_SELECTION);
  });

  test("offers the select-all header only when there is no maximum", () => {
    expect(buildColumns(null)[0].header).not.toBe("");
    expect(buildColumns(3)[0].header).toBe("");
  });
});

describe("buildRowSelection", () => {
  test("selects the configured accessions", () => {
    expect(buildRowSelection(["GCF_1.1", "GCF_2.1"])).toEqual({
      "GCF_1.1": true,
      "GCF_2.1": true,
    });
  });

  test("selects nothing when no assemblies are configured", () => {
    expect(buildRowSelection(undefined)).toEqual({});
    expect(buildRowSelection(null)).toEqual({});
  });
});

describe("renderButtonText", () => {
  test("names the count of selected assemblies", () => {
    expect(renderButtonText(1)).toBe("Add 1 Assembly");
    expect(renderButtonText(3)).toBe("Add 3 Assemblies");
  });
});

describe("getAddSelectionValidation", () => {
  test("explains the minimum while too few assemblies are selected", () => {
    expect(getAddSelectionValidation(0, WORKFLOW)).toBe(
      "Select at least 2 assemblies"
    );
    expect(getAddSelectionValidation(1, WORKFLOW)).toBe(
      "Select at least 2 assemblies"
    );
  });

  test("returns undefined once the minimum is selected", () => {
    expect(getAddSelectionValidation(2, WORKFLOW)).toBeUndefined();
  });
});

describe("getFastaCollectionData", () => {
  const TABLE = {
    getSelectedRowModel: () => ({
      rows: [{ id: "GCF_1.1" }, { id: "GCF_2.1" }],
    }),
  } as unknown as Table<Assembly>;

  test("configures the selected accessions", () => {
    expect(getFastaCollectionData(TABLE, "fastaCollection", undefined)).toEqual(
      { fastaCollection: ["GCF_1.1", "GCF_2.1"] }
    );
  });

  test("keeps the reference and gene model when the reference is still selected", () => {
    expect(getFastaCollectionData(TABLE, "fastaCollection", "GCF_2.1")).toEqual(
      { fastaCollection: ["GCF_1.1", "GCF_2.1"] }
    );
  });

  test("clears the reference and gene model when the reference is no longer selected", () => {
    expect(getFastaCollectionData(TABLE, "fastaCollection", "GCF_3.1")).toEqual(
      {
        fastaCollection: ["GCF_1.1", "GCF_2.1"],
        geneModelUrl: undefined,
        referenceAssembly: undefined,
      }
    );
  });
});
