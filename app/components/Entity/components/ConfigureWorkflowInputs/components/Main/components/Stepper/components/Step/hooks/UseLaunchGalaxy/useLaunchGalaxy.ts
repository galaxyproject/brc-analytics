import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { useCallback } from "react";
import {
  getDataLandingUrl,
  getDeSeq2LandingUrl,
  getWorkflowLandingUrl,
} from "../../../../../../../../../../../../utils/galaxy-api/galaxy-api";
import { Props, UseLaunchGalaxy } from "./types";
import { getConfiguredValues } from "./utils";
import { launchGalaxy } from "./utils";
import { CUSTOM_WORKFLOW } from "../../../../../../../../../../../../components/Entity/components/AnalysisMethod/components/CustomWorkflow/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../../../../../../../../components/Entity/components/AnalysisMethod/components/DifferentialExpressionAnalysis/constants";

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
          configuredValue.tracks,
          origin
        )
      );
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
