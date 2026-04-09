import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { useCallback } from "react";
import {
  getDataLandingUrl,
  getDeSeq2LandingUrl,
  getLMLSLandingUrl,
  getWorkflowLandingUrl,
} from "../../../../../../../../../../../../utils/galaxy-api/galaxy-api";
import { CUSTOM_WORKFLOW } from "../../../../../../../../../../../../views/AnalyzeWorkflowsView/custom/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../../../../../../../../views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { LEXICMAP } from "../../../../../../../../../../../../views/AnalyzeWorkflowsView/lexicmap/constants";
import { LOGAN_SEARCH } from "../../../../../../../../../../../../views/AnalyzeWorkflowsView/loganSearch/constants";
import { Props, UseLaunchGalaxy } from "./types";
import { getConfiguredValues, launchGalaxy } from "./utils";

export const useLaunchGalaxy = ({
  configuredInput,
  workflow,
}: Props): UseLaunchGalaxy => {
  const { error, isLoading: loading, run } = useAsync<string>();
  const { config } = useConfig();
  const configuredValue = getConfiguredValues(configuredInput, workflow);
  const disabled = !configuredValue;

  const onLaunchGalaxy = useCallback(async (): Promise<void> => {
    if (!configuredValue) return;
    const origin = config.browserURL || window.location.origin;

    let landingUrl = "";

    if (workflow.trsId === CUSTOM_WORKFLOW.trsId) {
      landingUrl = await run(
        getDataLandingUrl(
          configuredValue.referenceAssembly,
          configuredValue.geneModelUrl,
          configuredValue.readRunsSingle,
          configuredValue.readRunsPaired,
          null, // fastaCollection - not yet supported in UI
          configuredValue.tracks,
          origin
        )
      );
    } else if (
      workflow.trsId === LOGAN_SEARCH.trsId ||
      workflow.trsId === LEXICMAP.trsId
    ) {
      // LMLS workflows use stored workflow IDs with no parameters
      if (!workflow.workflowId) {
        throw new Error("Missing workflow ID for LMLS workflow");
      }
      landingUrl = await run(getLMLSLandingUrl(workflow.workflowId, origin));
    } else if (workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId) {
      if (
        !workflow.workflowId ||
        !configuredValue.geneModelUrl ||
        !configuredValue.sampleSheet ||
        !configuredValue.sampleSheetClassification ||
        !configuredValue.designFormula
      ) {
        throw new Error("Missing required values for DE workflow");
      }
      landingUrl = await run(
        getDeSeq2LandingUrl(
          workflow.workflowId,
          configuredValue.referenceAssembly,
          configuredValue.geneModelUrl,
          configuredValue.sampleSheet,
          configuredValue.sampleSheetClassification,
          configuredValue.designFormula,
          configuredValue.primaryContrasts,
          configuredValue.strandedness,
          origin
        )
      );
    } else {
      landingUrl = await run(
        getWorkflowLandingUrl(
          workflow.trsId,
          configuredValue.referenceAssembly,
          configuredValue.geneModelUrl,
          configuredValue.readRunsSingle,
          configuredValue.readRunsPaired,
          null, // fastaCollection - not yet supported in UI
          workflow.parameters,
          origin
        )
      );
    }

    if (!landingUrl) {
      throw new Error("Failed to retrieve Galaxy workflow launch URL.");
    }

    // Launch the Galaxy workflow.
    launchGalaxy(landingUrl);
  }, [config, configuredValue, run, workflow]);

  let errorMessage: string | null = null;
  if (error) {
    errorMessage = (error as Error).message || "Failed to launch Galaxy";
  }

  return { onLaunchGalaxy, status: { disabled, error: errorMessage, loading } };
};
