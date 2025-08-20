import { useCallback, useEffect, useState } from "react";
import { UseENADataByTaxonomyId } from "./types";
import { fetchENAData } from "./request";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { shouldFetch } from "./utils";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const useENADataByTaxonomyId = <T>(
  genome: BRCDataCatalogGenome | null
): UseENADataByTaxonomyId<T> => {
  const { data, run } = useAsync<T[] | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  // TODO: i think we shouldnt fetch taxon id from genome, since some workflows dont have genome
  const taxonomyId = genome?.ncbiTaxonomyId;

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
        taxonomyId: taxonomyId || "",
      })
    );
  }, [run, taxonomyId]);

  useEffect(() => {
    if (taxonomyId && shouldFetch(taxonomyId)) {
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
