import { useCallback, useEffect, useState } from "react";
import { UseENADataByTaxonomyId } from "./types";
import { fetchENAData } from "./request";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { isEligible } from "./utils";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { AppSiteConfig } from "../../../../../../../../../../../../../../../../site-config/common/entities";
import { Assembly } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/types";

export const useENADataByTaxonomyId = <T>(
  genome: Assembly
): UseENADataByTaxonomyId<T> => {
  const { ncbiTaxonomyId: taxonomyId } = genome;
  const { config } = useConfig();
  const { maxReadRunsForBrowseAll: maxReadRuns } = config as AppSiteConfig;
  const { data, run } = useAsync<T[] | undefined>();
  const [eligible] = useState<boolean>(isEligible(taxonomyId, maxReadRuns));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const onRequestData = useCallback(async (): Promise<void> => {
    run(
      fetchENAData({
        submitOptions: {
          onError: (e) => {
            setErrors({ taxonomyId: e.message });
            setLoading(false);
          },
          onSuccess: () => {
            setLoading(false);
          },
        },
        taxonomyId,
      })
    );
  }, [run, taxonomyId]);

  useEffect(() => {
    if (eligible) {
      // Request sequencing data by taxonomy ID and configured filters.
      onRequestData();
    } else {
      // When the read count is not found, is 0, or greater than the maximum allowable count,
      // the user should not be able to browse sequences by taxonomy ID.
      setLoading(false);
    }
  }, [eligible, onRequestData]);

  return { data, status: { eligible, errors, loading } };
};
