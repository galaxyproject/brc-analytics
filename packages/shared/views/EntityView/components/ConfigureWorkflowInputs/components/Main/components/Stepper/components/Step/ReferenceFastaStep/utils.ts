import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import type { AssemblyContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import { getGenomeStrainText } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { workflowRequiresFastaCollection } from "@repo/shared/workflow/utils";
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
 * @param workflow - Workflow being configured.
 * @returns Reference candidates.
 */
function getReferenceCandidates(
  assemblies: AssemblyContract[],
  fastaCollection: ConfiguredInput["fastaCollection"],
  workflow: Workflow
): AssemblyContract[] {
  if (!workflowRequiresFastaCollection(workflow)) return assemblies;
  const byAccession = new Map(
    assemblies.map((assembly) => [assembly.accession, assembly])
  );
  return (fastaCollection ?? []).flatMap((accession) => {
    const assembly = byAccession.get(accession);
    return assembly ? [assembly] : [];
  });
}

/**
 * Returns the assemblies the reference can be chosen from: for a workflow that
 * takes an assembly collection, the assemblies picked for it, in the order
 * they were picked; otherwise every assembly of the organism.
 * @param assemblies - The organism's assemblies.
 * @param fastaCollection - Configured assembly collection accessions.
 * @param workflow - Workflow being configured.
 * @returns Reference options.
 */
export function getReferenceOptions(
  assemblies: AssemblyContract[],
  fastaCollection: ConfiguredInput["fastaCollection"],
  workflow: Workflow
): ReferenceOption[] {
  return getReferenceCandidates(assemblies, fastaCollection, workflow).map(
    (assembly) => ({
      description: getGenomeStrainText(assembly, LABEL.UNSPECIFIED),
      value: assembly.accession,
    })
  );
}
