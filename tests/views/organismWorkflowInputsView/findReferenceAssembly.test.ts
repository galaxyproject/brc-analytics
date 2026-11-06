import type { AssemblyContract } from "@repo/shared/apis/types";
import { findReferenceAssembly } from "@repo/shared/views/OrganismWorkflowInputsView/utils";

const ASSEMBLIES = [
  { accession: "GCF_1.1" },
  { accession: "GCF_2.1" },
] as AssemblyContract[];

describe("findReferenceAssembly", () => {
  test("finds the configured reference among the organism's assemblies", () => {
    expect(findReferenceAssembly(ASSEMBLIES, "GCF_2.1")).toBe(ASSEMBLIES[1]);
  });

  test("returns null when no reference is configured or it isn't listed", () => {
    expect(findReferenceAssembly(ASSEMBLIES, undefined)).toBeNull();
    expect(findReferenceAssembly(ASSEMBLIES, "GCF_9.1")).toBeNull();
    expect(findReferenceAssembly(undefined, "GCF_1.1")).toBeNull();
  });
});
