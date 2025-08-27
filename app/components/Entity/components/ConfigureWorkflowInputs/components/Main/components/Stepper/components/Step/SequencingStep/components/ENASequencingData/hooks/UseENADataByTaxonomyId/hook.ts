import { useCallback, useEffect, useState } from "react";
import { UseENADataByTaxonomyId } from "./types";
import { fetchENAData } from "./request";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { shouldFetch } from "./utils";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../../../apis/catalog/ga2/entities";

export const useENADataByTaxonomyId = <T>(
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): UseENADataByTaxonomyId<T> => {
  const { data, run } = useAsync<T[] | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { ncbiTaxonomyId: taxonomyId } = genome;

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
    if (shouldFetch(taxonomyId)) {
      // Request sequencing data by taxonomy ID and configured filters.
      onRequestData();
    } else {
      // When the read count is not found, is 0, or greater than the maximum allowable count,
      // the user should not be able to browse all sequences.
      setLoading(false);
    }
  }, [onRequestData, taxonomyId]);

  return { data, status: { errors, loading } };
};
