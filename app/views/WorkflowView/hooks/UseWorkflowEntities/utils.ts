import type {
  BRCDataCatalogOrganism,
  Workflow,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_SCOPE } from "@/apis/catalog/brc-analytics-catalog/common/schema-entities";
import type { GA2OrganismEntity } from "@/apis/catalog/ga2/entities";
import { findOrganism, getAssembly } from "@/services/workflows/entities";
import type { Organism } from "@/views/OrganismView/types";
import { mapOrganismEntityToOrganism } from "@/views/OrganismWorkflowInputsView/utils";
import type { Assembly } from "@/views/WorkflowInputsView/types";
import { mapAssemblyToOrganism } from "@/views/WorkflowInputsView/utils";
import { sanitizeEntityId } from "@brc-analytics/core/apis/utils";

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
  organismEntity: BRCDataCatalogOrganism | GA2OrganismEntity | undefined,
  genome: Assembly | undefined
): Organism | undefined {
  if (organismEntity) return mapOrganismEntityToOrganism(organismEntity);
  return genome ? mapAssemblyToOrganism(genome) : undefined;
}

/**
 * Resolves the organism entity for organism-scoped workflows, anchored by the
 * workflow's taxonomyId (these workflows have no assembly). Matches by taxonomy
 * id and returns undefined when no catalog organism exists — organism-scoped
 * workflows may target a clade (e.g. Viruses, taxid 10239) with no organism
 * entry, which must not crash the view.
 * @param workflow - Workflow being configured.
 * @returns The organism entity, or undefined for assembly-scoped / no-taxonomyId
 * workflows, or clades without a catalog organism.
 */
export function getWorkflowOrganismEntity(
  workflow: Workflow
): BRCDataCatalogOrganism | GA2OrganismEntity | undefined {
  if (workflow.scope !== WORKFLOW_SCOPE.ORGANISM || !workflow.taxonomyId) {
    return undefined;
  }
  return findOrganism<BRCDataCatalogOrganism | GA2OrganismEntity>(
    sanitizeEntityId(workflow.taxonomyId)
  );
}
