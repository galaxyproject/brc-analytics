import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { AssemblyContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  configureReference,
  getReferenceOptions,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceFastaStep/utils";

/**
 * Returns an assembly with the given accession and strain name.
 * @param accession - Assembly accession.
 * @param strainName - Strain name.
 * @returns Assembly.
 */
function makeAssembly(
  accession: string,
  strainName: string | null = null
): AssemblyContract {
  return {
    accession,
    strainName,
    taxonomicLevelStrain: "None",
  } as AssemblyContract;
}

const COLLECTION_WORKFLOW = {
  parameters: [
    {
      key: "unaligned sequences",
      variable: WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION,
    },
  ],
} as Workflow;

const NO_COLLECTION_WORKFLOW = {
  parameters: [
    {
      key: "reference Fasta",
      variable: WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL,
    },
  ],
} as Workflow;

const ASSEMBLIES = [
  makeAssembly("GCF_1.1", "Strain A"),
  makeAssembly("GCF_2.1"),
  makeAssembly("GCF_3.1", "Strain C"),
];

describe("getReferenceOptions", () => {
  test("lists the collection's assemblies, in collection order", () => {
    expect(
      getReferenceOptions(
        ASSEMBLIES,
        ["GCF_3.1", "GCF_1.1"],
        COLLECTION_WORKFLOW
      )
    ).toEqual([
      { description: "Strain C", value: "GCF_3.1" },
      { description: "Strain A", value: "GCF_1.1" },
    ]);
  });

  test("lists nothing until the collection is picked", () => {
    expect(
      getReferenceOptions(ASSEMBLIES, undefined, COLLECTION_WORKFLOW)
    ).toEqual([]);
  });

  test("lists every assembly when the workflow takes no collection", () => {
    expect(
      getReferenceOptions(ASSEMBLIES, undefined, NO_COLLECTION_WORKFLOW).map(
        ({ value }) => value
      )
    ).toEqual(["GCF_1.1", "GCF_2.1", "GCF_3.1"]);
  });

  test("describes an assembly with no strain as unspecified", () => {
    expect(
      getReferenceOptions(ASSEMBLIES, ["GCF_2.1"], COLLECTION_WORKFLOW)[0]
        .description
    ).toBe("Unspecified");
  });
});

describe("configureReference", () => {
  test("sets the reference and clears the gene model", () => {
    expect(configureReference("GCF_1.1")).toEqual({
      geneModelUrl: undefined,
      referenceAssembly: "GCF_1.1",
    });
  });
});
