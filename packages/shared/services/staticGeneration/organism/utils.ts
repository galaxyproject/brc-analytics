import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { makeWorkflowCategoriesAugmenter } from "@repo/shared/services/staticGeneration/workflows/utils";
import { workflowRequiresFastaCollection } from "@repo/shared/workflow/utils";

/**
 * Binds a site's config to a build-time augmenter that slims an organism's
 * genomes, given the workflows compatible with the organism.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns Build-time augmenter for the site's organism records.
 */
export function makeSlimOrganismGenomes(
  config: () => Pick<SiteConfig, "entities">
): (organism: OrganismContract) => Promise<OrganismContract> {
  const withWorkflowCategories =
    makeWorkflowCategoriesAugmenter<OrganismContract>(config);
  return async (organism) =>
    slimOrganismGenomes(
      organism,
      (await withWorkflowCategories(organism)).workflowCategories
    );
}

/**
 * Cuts each of an organism's genomes down to its lineage taxonomy IDs, the
 * only genome field the workflow-compatibility check reads, for pages that
 * embed the organism record but never render its genomes. A full genome record
 * is roughly forty fields, so an organism with many assemblies would otherwise
 * embed hundreds of kilobytes it doesn't use. Genomes are kept in full when a
 * workflow compatible with the organism takes a collection of its assemblies
 * or a reference assembly, since that workflow's configure page lists them for
 * the user to pick from.
 * @param organism - Organism record.
 * @param organismWorkflowCategories - Workflow categories compatible with the organism.
 * @returns The organism, with each genome reduced to its lineage taxonomy IDs
 * unless its genomes are listed for picking.
 */
export function slimOrganismGenomes(
  organism: OrganismContract,
  organismWorkflowCategories: WorkflowCategory[]
): OrganismContract {
  if (!organism.genomes) return organism;
  if (
    organismWorkflowCategories.some(({ workflows }) =>
      workflows.some(workflowListsOrganismAssemblies)
    )
  )
    return organism;
  return {
    ...organism,
    genomes: organism.genomes.map(({ lineageTaxonomyIds }) => ({
      lineageTaxonomyIds,
    })),
  };
}

/**
 * Determines whether an organism-scoped workflow's configure page lists the
 * organism's assemblies for the user to pick from: it takes a collection of
 * them, or a reference assembly.
 * @param workflow - Workflow.
 * @returns True when the workflow lists the organism's assemblies.
 */
function workflowListsOrganismAssemblies(workflow: Workflow): boolean {
  return (
    workflowRequiresFastaCollection(workflow) ||
    workflow.parameters.some(
      ({ variable }) =>
        variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL
    )
  );
}
