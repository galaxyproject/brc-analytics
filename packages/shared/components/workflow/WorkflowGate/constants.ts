import { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";

/**
 * Workflow scopes the assembly configure page accepts. Organism-scope
 * workflows are included because the assistant hands off every workflow to the
 * assembly configure page, whatever its scope.
 */
export const ASSEMBLY_CONFIGURE_SCOPES: readonly WORKFLOW_SCOPE[] = [
  WORKFLOW_SCOPE.ASSEMBLY,
  WORKFLOW_SCOPE.ORGANISM,
];

/**
 * Workflow scopes the organism configure page accepts.
 */
export const ORGANISM_CONFIGURE_SCOPES: readonly WORKFLOW_SCOPE[] = [
  WORKFLOW_SCOPE.ORGANISM,
];
