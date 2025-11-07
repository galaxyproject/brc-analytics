import { getAssemblyTracks } from "../../../../../../../../../../../../../utils/ucsc-tracks-api/ucsc-tracks-api";
import { UseUCSCTracks } from "./types";
import { useCallback, useEffect } from "react";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { UcscTrackNode } from "../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export const useUCSCTracks = (assembly: string): UseUCSCTracks => {
  const { data, run } = useAsync<UcscTrackNode[] | undefined>();

  const onRequestData = useCallback(async (): Promise<void> => {
    run(getAssemblyTracks(assembly));
  }, [assembly, run]);

  useEffect(() => {
    onRequestData();
  }, [onRequestData]);

  return { data };
};
