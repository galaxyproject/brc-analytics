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
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredValue,
  isAssemblyConfiguredValue,
  Props,
  UseLaunchGalaxy,
} from "./types";
import { getConfiguredValues, launchGalaxy } from "./utils";

/**
 * Gets the appropriate landing URL based on workflow type.
 * @param workflow - Workflow to launch.
 * @param configuredValue - Configured values for the workflow.
 * @param origin - Origin URL for the Galaxy instance.
 * @param run - Async runner function from useAsync hook.
 * @returns Promise resolving to the Galaxy workflow landing URL.
 */
async function getLandingUrlForWorkflow(
  workflow: Workflow,
  configuredValue: ConfiguredValue,
  origin: string,
  run: (promise: Promise<string>) => Promise<string>
): Promise<string> {
  if (workflow.trsId === CUSTOM_WORKFLOW.trsId) {
    if (!isAssemblyConfiguredValue(configuredValue)) {
      throw new Error("Invalid configured value for CUSTOM workflow");
    }
    return run(
      getDataLandingUrl(
        configuredValue.referenceAssembly,
        configuredValue.geneModelUrl,
        configuredValue.readRunsSingle,
        configuredValue.readRunsPaired,
        null,
        configuredValue.tracks,
        origin
      )
    );
  }

  if (
    workflow.trsId === LOGAN_SEARCH.trsId ||
    workflow.trsId === LEXICMAP.trsId
  ) {
    if (!workflow.workflowId) {
      throw new Error("Missing workflow ID for LMLS workflow");
    }
    return run(getLMLSLandingUrl(workflow.workflowId, origin));
  }

  if (workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId) {
    if (
      !workflow.workflowId ||
      !isAssemblyConfiguredValue(configuredValue) ||
      !configuredValue.geneModelUrl ||
      !configuredValue.sampleSheet ||
      !configuredValue.sampleSheetClassification ||
      !configuredValue.designFormula
    ) {
      throw new Error("Missing required values for DE workflow");
    }
    return run(
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
  }

  return run(
    getWorkflowLandingUrl(
      workflow.trsId,
      isAssemblyConfiguredValue(configuredValue)
        ? configuredValue.referenceAssembly
        : "",
      isAssemblyConfiguredValue(configuredValue)
        ? configuredValue.geneModelUrl
        : null,
      configuredValue.readRunsSingle,
      configuredValue.readRunsPaired,
      null,
      workflow.parameters,
      origin
    )
  );
}

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

    const landingUrl = await getLandingUrlForWorkflow(
      workflow,
      configuredValue,
      origin,
      run
    );

    if (!landingUrl) {
      throw new Error("Failed to retrieve Galaxy workflow launch URL.");
    }

    launchGalaxy(landingUrl);
  }, [config, configuredValue, run, workflow]);

  let errorMessage: string | null = null;
  if (error) {
    errorMessage = (error as Error).message || "Failed to launch Galaxy";
  }

  return { onLaunchGalaxy, status: { disabled, error: errorMessage, loading } };
};
