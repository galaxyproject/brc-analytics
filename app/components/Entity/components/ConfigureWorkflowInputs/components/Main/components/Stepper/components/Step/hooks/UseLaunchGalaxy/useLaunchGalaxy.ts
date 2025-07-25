import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useCallback, useEffect } from "react";
import { getWorkflowLandingUrl } from "../../../../../../../../../../../../utils/galaxy-api/galaxy-api";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Props, UseLaunchGalaxy } from "./types";
import { getConfiguredValues } from "./utils";

export const useLaunchGalaxy = ({
  configuredInput,
  workflow,
}: Props): UseLaunchGalaxy => {
  const {
    data: landingUrl,
    error,
    isLoading: loading,
    run,
  } = useAsync<string>();
  const configuredValue = getConfiguredValues(configuredInput, workflow);
  const disabled = !configuredValue;

  const onLaunchGalaxy = useCallback(async (): Promise<void> => {
    if (!configuredValue) return;

    await run(
      getWorkflowLandingUrl(
        workflow.trsId,
        configuredValue.referenceAssembly,
        configuredValue.geneModelUrl,
        configuredValue.readRunsSingle,
        configuredValue.readRunsPaired,
        workflow.parameters
      )
    );
  }, [configuredValue, run, workflow]);

  useEffect(() => {
    if (!landingUrl) return;
    window.open(
      landingUrl,
      ANCHOR_TARGET.BLANK,
      REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
    );
  }, [landingUrl]);

  let errorMessage: string | null = null;
  if (error) {
    errorMessage = (error as Error).message || "Failed to launch Galaxy";
  }

  return { onLaunchGalaxy, status: { disabled, error: errorMessage, loading } };
};
