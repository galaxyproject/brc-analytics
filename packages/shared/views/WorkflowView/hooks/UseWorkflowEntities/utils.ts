import type { OrganismContract } from "@repo/shared/apis/types";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  getAssembly,
  getOrganism,
} from "@repo/shared/services/workflows/entities";
import { mapOrganismEntityToOrganism } from "@repo/shared/views/OrganismWorkflowInputsView/utils";
import type { Assembly } from "@repo/shared/views/WorkflowInputsView/types";
import { mapAssemblyToOrganism } from "@repo/shared/views/WorkflowInputsView/utils";
import { findWorkflowTaxonOrganism } from "@repo/shared/workflow/cladeOrganisms";

/**
 * Resolves the reference-assembly genome, when one is configured.
 * @param referenceAssembly - Configured reference assembly accession, if any.
 * @returns The assembly, or undefined when none is configured.
 */
export function getWorkflowGenome(
  referenceAssembly: string | undefined
): Assembly | undefined {
  const assemblyId = sanitizeEntityId(referenceAssembly);
  return assemblyId ? getAssembly<Assembly>(assemblyId) : undefined;
}

/**
 * Maps the resolved organism entity or assembly to the organism shape consumed
 * by the side panel.
 * @param organismEntity - Organism entity for organism-scoped workflows, if any.
 * @param genome - Reference assembly, if any.
 * @returns The side-panel organism, or undefined when neither is available.
 */
export function getWorkflowOrganism(
  organismEntity: OrganismContract | undefined,
  genome: Assembly | undefined
): OrganismContract | undefined {
  if (organismEntity) return mapOrganismEntityToOrganism(organismEntity);
  return genome ? mapAssemblyToOrganism(genome) : undefined;
}

/**
 * Resolves the organism entity for organism-scoped workflows (these workflows
 * have no assembly). Anchored by the workflow's taxonomyId when it is a catalog
 * organism; otherwise the taxonomyId is a clade (e.g. Viruses, taxid 10239)
 * with no organism entry, and the organism is the species the user picks
 * within that clade (required before the read-run step).
 * @param workflow - Workflow being configured.
 * @param configuredOrganism - Taxonomy ID of the organism picked within the
 * workflow's clade, if any. Only the organism picker sets it, from its
 * clade-filtered rows.
 * @returns The workflow's taxonomyId organism, else the picked organism, or
 * undefined when the taxonomyId is not a catalog organism and no species has
 * been picked yet.
 */
export function getWorkflowOrganismEntity(
  workflow: Workflow,
  configuredOrganism: string | undefined
): OrganismContract | undefined {
  const organism = findWorkflowTaxonOrganism(workflow);
  if (organism || !configuredOrganism) return organism;
  return getOrganism<OrganismContract>(sanitizeEntityId(configuredOrganism));
}
