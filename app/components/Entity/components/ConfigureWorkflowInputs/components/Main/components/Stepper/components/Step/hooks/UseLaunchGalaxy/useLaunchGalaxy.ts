import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useCallback, useEffect } from "react";
import { getWorkflowLandingUrl } from "../../../../../../../../../../../../utils/galaxy-api";
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
  const { data: landingUrl, isLoading: loading, run } = useAsync<string>();
  const configuredValue = getConfiguredValues(configuredInput);
  const disabled = !configuredValue;

  const onLaunch = useCallback(async (): Promise<void> => {
    if (!configuredValue) return;
    await run(
      getWorkflowLandingUrl(
        workflow.trsId,
        configuredValue.referenceAssembly,
        configuredValue.geneModelUrl,
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

  return { launchStatus: { disabled, loading }, onLaunch };
};
