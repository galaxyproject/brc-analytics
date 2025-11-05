import { useCallback, useEffect, useState } from "react";
import { UseENADataByTaxonomyId } from "./types";
import { fetchENAData } from "./request";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { isEligible } from "./utils";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../../../apis/catalog/ga2/entities";
import { ColumnFiltersState } from "@tanstack/react-table";
import { preSelectColumnFilters } from "../../components/CollectionSelector/utils";
import { SEQUENCING_DATA_TYPE } from "../../../../types";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { AppSiteConfig } from "../../../../../../../../../../../../../../../../site-config/common/entities";

export const useENADataByTaxonomyId = <T>(
  workflow: Workflow,
  genome: BRCDataCatalogGenome | GA2AssemblyEntity,
  stepKey: SEQUENCING_DATA_TYPE
): UseENADataByTaxonomyId<T> => {
  const { ncbiTaxonomyId: taxonomyId } = genome;
  const { config } = useConfig();
  const { maxReadRunsForBrowseAll: maxReadRuns } = config as AppSiteConfig;
  const { data, run } = useAsync<T[] | undefined>();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
            // If the step key is READ_RUNS_ANY, do not pre-select column filters.
            if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) return;
            setColumnFilters(preSelectColumnFilters(workflow, stepKey));
          },
        },
        taxonomyId,
      })
    );
  }, [run, stepKey, taxonomyId, workflow]);

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

  return { columnFilters, data, status: { eligible, errors, loading } };
};
