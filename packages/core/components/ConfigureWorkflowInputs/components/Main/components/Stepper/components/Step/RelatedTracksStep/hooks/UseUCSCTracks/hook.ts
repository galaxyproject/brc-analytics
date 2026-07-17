import { UcscTrackNode } from "@brc-analytics/core/utils/ucsc-tracks-api/types";
import { getAssemblyTracks } from "@brc-analytics/core/utils/ucsc-tracks-api/ucsc-tracks-api";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { useCallback, useEffect } from "react";
import { UseUCSCTracks } from "./types";

export const useUCSCTracks = (assembly?: string): UseUCSCTracks => {
  const { data, run } = useAsync<UcscTrackNode[] | undefined>();

  const onRequestData = useCallback(async (): Promise<void> => {
    if (!assembly) return;
    run(getAssemblyTracks(assembly));
  }, [assembly, run]);

  useEffect(() => {
    onRequestData();
  }, [onRequestData]);

  return { data };
};
