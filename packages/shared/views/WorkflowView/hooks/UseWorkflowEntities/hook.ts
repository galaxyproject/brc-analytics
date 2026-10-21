import type { Workflow } from "@repo/shared/apis/workflow";
import { buildWorkflowEntityValue } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/utils";
import { useMemo } from "react";
import type { UseWorkflowEntities } from "./types";
import {
  getWorkflowGenome,
  getWorkflowOrganism,
  getWorkflowOrganismEntity,
} from "./utils";

/**
 * Resolves the assembly/organism that anchors a workflow's configuration: the
 * reference-assembly genome (assembly-scoped) or, for organism-scoped workflows,
 * the organism looked up from the workflow's taxonomyId — or the species picked
 * within it when that taxonomyId is a clade — plus the derived WorkflowEntity
 * context value and the side-panel organism details.
 * @param workflow - Workflow being configured.
 * @param referenceAssembly - Configured reference assembly accession, if any.
 * @param configuredOrganism - Taxonomy ID of the organism picked within the
 * workflow's clade, if any.
 * @returns The genome, organism, and workflow entity context value.
 */
export function useWorkflowEntities(
  workflow: Workflow,
  referenceAssembly: string | undefined,
  configuredOrganism: string | undefined
): UseWorkflowEntities {
  const genome = useMemo(
    () => getWorkflowGenome(referenceAssembly),
    [referenceAssembly]
  );

  const organismEntity = useMemo(
    () => getWorkflowOrganismEntity(workflow, configuredOrganism),
    [workflow, configuredOrganism]
  );

  const workflowEntityValue = useMemo(
    () => buildWorkflowEntityValue(organismEntity ?? genome),
    [organismEntity, genome]
  );

  const organism = useMemo(
    () => getWorkflowOrganism(organismEntity, genome),
    [organismEntity, genome]
  );

  return { genome, organism, workflowEntityValue };
}
