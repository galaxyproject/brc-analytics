import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowIsCompatibleWithEntity } from "./utils";
import { WORKFLOW_TARGET_PAGE } from "../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

import { useRouter } from "next/router";
import { Fragment } from "react";

export const AnalysisMethodsCatalog = ({ entity }: Props): JSX.Element => {
  const {
    query: { entityId, entityListType },
  } = useRouter();

  // Determine the target page based on the entity type
  const targetPage =
    entityListType === "organisms"
      ? WORKFLOW_TARGET_PAGE.ORGANISMS
      : WORKFLOW_TARGET_PAGE.ASSEMBLIES;

  // For organisms, we need to get the genome properties from the first genome
  // For assemblies, the entity itself is the genome
  const isOrganism = entityListType === "organisms";
  const genome = isOrganism
    ? (entity as BRCDataCatalogOrganism).genomes?.[0]
    : (entity as BRCDataCatalogGenome);

  // If organism has no genomes, we can't proceed
  if (isOrganism && !genome) {
    return <Fragment>No genome data available for this organism.</Fragment>;
  }

  return (
    <Fragment>
      {workflows.map((workflowCategory) => {
        // First filter by category-level targetPages
        if (
          workflowCategory.targetPages &&
          !workflowCategory.targetPages.includes(targetPage)
        ) {
          return null; // Skip entire category if it doesn't target this page
        }

        // Then filter workflows by entity compatibility (ploidy and taxonomy)
        const compatibleWorkflows = workflowCategory.workflows.filter(
          (workflow) => workflowIsCompatibleWithEntity(workflow, entity)
        );

        // Show category if:
        // 1. It has compatible workflows after filtering, OR
        // 2. It was marked for "coming soon" and had no workflows originally
        if (
          compatibleWorkflows.length === 0 &&
          !workflowCategory.showComingSoon
        ) {
          return null;
        }

        return (
          <AnalysisMethod
            entityId={entityId as string}
            entityListType={entityListType as string}
            geneModelUrl={genome.geneModelUrl}
            genomeVersionAssemblyId={genome.accession}
            key={workflowCategory.category}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </Fragment>
  );
};
