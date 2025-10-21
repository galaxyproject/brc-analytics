import { useCallback, useEffect, useState } from "react";
import { UseENADataByTaxonomyId } from "./types";
import { fetchENAData } from "./request";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { shouldFetch } from "./utils";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../../../apis/catalog/ga2/entities";
import { config } from "../../../../../../../../../../../../../../../../app/config/config";
import { ColumnFiltersState } from "@tanstack/react-table";
import { preSelectColumnFilters } from "../../components/CollectionSelector/utils";
import { SEQUENCING_DATA_TYPE } from "../../../../types";

export const useENADataByTaxonomyId = <T>(
  workflow: Workflow,
  genome: BRCDataCatalogGenome | GA2AssemblyEntity,
  stepKey: SEQUENCING_DATA_TYPE
): UseENADataByTaxonomyId<T> => {
  const { data, run } = useAsync<T[] | undefined>();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { ncbiTaxonomyId: taxonomyId } = genome;
  const { maxReadRunsForBrowseAll } = config();

  const onRequestData = useCallback(async (): Promise<void> => {
    run(
      fetchENAData({
        submitOptions: {
          onError: (e) => {
            setErrors({ taxonomyId: e.message });
            setLoading(false);
          },
          onSuccess: (readRuns) => {
            setLoading(false);
            setColumnFilters(
              preSelectColumnFilters(workflow, readRuns, stepKey)
            );
          },
        },
        taxonomyId,
      })
    );
  }, [run, stepKey, taxonomyId, workflow]);

  useEffect(() => {
    if (shouldFetch(taxonomyId, maxReadRunsForBrowseAll)) {
      // Request sequencing data by taxonomy ID and configured filters.
      onRequestData();
    } else {
      // When the read count is not found, is 0, or greater than the maximum allowable count,
      // the user should not be able to browse all sequences.
      setLoading(false);
    }
  }, [onRequestData, taxonomyId, maxReadRunsForBrowseAll]);

  return { columnFilters, data, status: { errors, loading } };
};
