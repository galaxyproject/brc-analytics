import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useCallback } from "react";
import {
  getDataLandingUrl,
  getWorkflowLandingUrl,
} from "../../../../../../../../../../../../utils/galaxy-api/galaxy-api";
import { Props, UseLaunchGalaxy } from "./types";
import { getConfiguredValues } from "./utils";
import { launchGalaxy } from "./utils";
import { CUSTOM_WORKFLOW } from "../../../../../../../../../../../../components/Entity/components/AnalysisMethod/components/CustomWorkflow/constants";

export const useLaunchGalaxy = ({
  configuredInput,
  workflow,
}: Props): UseLaunchGalaxy => {
  const { error, isLoading: loading, run } = useAsync<string>();
  const configuredValue = getConfiguredValues(configuredInput, workflow);
  const disabled = !configuredValue;

  const onLaunchGalaxy = useCallback(async (): Promise<void> => {
    if (!configuredValue) return;

    const landingUrl =
      workflow.trsId === CUSTOM_WORKFLOW.trsId
        ? await run(
            getDataLandingUrl(
              configuredValue.referenceAssembly,
              configuredValue.geneModelUrl,
              configuredValue.readRunsSingle,
              configuredValue.readRunsPaired,
              configuredValue.tracks
            )
          )
        : await run(
            getWorkflowLandingUrl(
              workflow.trsId,
              configuredValue.referenceAssembly,
              configuredValue.geneModelUrl,
              configuredValue.readRunsSingle,
              configuredValue.readRunsPaired,
              workflow.parameters
            )
          );

    if (!landingUrl) {
      throw new Error("Failed to retrieve Galaxy workflow launch URL.");
    }

    // Launch the Galaxy workflow.
    launchGalaxy(landingUrl);
  }, [configuredValue, run, workflow]);

  let errorMessage: string | null = null;
  if (error) {
    errorMessage = (error as Error).message || "Failed to launch Galaxy";
  }

  return { onLaunchGalaxy, status: { disabled, error: errorMessage, loading } };
};
