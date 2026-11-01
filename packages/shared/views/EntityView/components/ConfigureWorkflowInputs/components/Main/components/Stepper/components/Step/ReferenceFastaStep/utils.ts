import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import type { AssemblyContract } from "@repo/shared/apis/types";
import { getGenomeStrainText } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { type ReferenceOption } from "./types";

/**
 * Returns the configured input for a chosen reference assembly. The gene model
 * is cleared, so the GTF step picks one for the new reference.
 * @param referenceAssembly - Chosen reference assembly accession.
 * @returns Partial configured input.
 */
export function configureReference(
  referenceAssembly: string
): Partial<ConfiguredInput> {
  return { geneModelUrl: undefined, referenceAssembly };
}

/**
 * Returns the assemblies the reference can be chosen from.
 * @param assemblies - The organism's assemblies.
 * @param fastaCollection - Configured assembly collection accessions.
 * @returns Reference candidates.
 */
function getReferenceCandidates(
  assemblies: AssemblyContract[],
  fastaCollection: ConfiguredInput["fastaCollection"]
): AssemblyContract[] {
  const byAccession = new Map(
    assemblies.map((assembly) => [assembly.accession, assembly])
  );
  return (fastaCollection ?? []).flatMap((accession) => {
    const assembly = byAccession.get(accession);
    return assembly ? [assembly] : [];
  });
}

/**
 * Returns the assemblies the reference can be chosen from: the assemblies
 * picked for the assembly collection, in the order they were picked.
 * @param assemblies - The organism's assemblies.
 * @param fastaCollection - Configured assembly collection accessions.
 * @returns Reference options.
 */
export function getReferenceOptions(
  assemblies: AssemblyContract[],
  fastaCollection: ConfiguredInput["fastaCollection"]
): ReferenceOption[] {
  return getReferenceCandidates(assemblies, fastaCollection).map(
    (assembly) => ({
      description: getGenomeStrainText(assembly, LABEL.UNSPECIFIED),
      value: assembly.accession,
    })
  );
}
