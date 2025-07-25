import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowIsCompatibleWithAssembly } from "./utils";

import { useRouter } from "next/router";
import { Fragment } from "react";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const {
    query: { entityId },
  } = useRouter();

  return (
    <Fragment>
      {workflows.map((workflowCategory) => {
        const compatibleWorkflows = workflowCategory.workflows.filter(
          (workflow) => workflowIsCompatibleWithAssembly(workflow, assembly)
        );
        if (
          compatibleWorkflows.length === 0 &&
          !workflowCategory.showComingSoon
        ) {
          return null;
        }
        return (
          <AnalysisMethod
            entityId={entityId as string}
            geneModelUrl={assembly.geneModelUrl}
            genomeVersionAssemblyId={assembly.accession}
            key={workflowCategory.category}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </Fragment>
  );
};
