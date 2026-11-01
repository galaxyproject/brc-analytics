import type { AssemblyContract } from "@repo/shared/apis/types";
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

const ASSEMBLIES = [
  makeAssembly("GCF_1.1", "Strain A"),
  makeAssembly("GCF_2.1"),
  makeAssembly("GCF_3.1", "Strain C"),
];

describe("getReferenceOptions", () => {
  test("lists the collection's assemblies, in collection order", () => {
    expect(
      getReferenceOptions(ASSEMBLIES, ["GCF_3.1", "GCF_1.1"])
    ).toStrictEqual([
      { description: "Strain C", value: "GCF_3.1" },
      { description: "Strain A", value: "GCF_1.1" },
    ]);
  });

  test("lists nothing until the collection is picked", () => {
    expect(getReferenceOptions(ASSEMBLIES, undefined)).toStrictEqual([]);
  });

  test("describes an assembly with no strain as unspecified", () => {
    expect(getReferenceOptions(ASSEMBLIES, ["GCF_2.1"])[0].description).toBe(
      "Unspecified"
    );
  });
});

describe("configureReference", () => {
  test("sets the reference and clears the gene model", () => {
    expect(configureReference("GCF_1.1")).toStrictEqual({
      geneModelUrl: undefined,
      referenceAssembly: "GCF_1.1",
    });
  });
});
