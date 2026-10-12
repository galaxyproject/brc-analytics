import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { useEffect, useRef } from "react";
import {
  useLoganFilters,
  type UseLoganFilters,
} from "./LoganSearchFilters/useLoganFilters";

export interface UseLoganSearch {
  filtering: UseLoganFilters;
  filtersEnabled: boolean;
  search: ReturnType<typeof useKmindexSearch>;
}

/**
 * A Logan search and the filters over its results, wired together: the
 * filters ride on every results request, and belong to the job they were
 * picked on.
 * @returns The search, its filters, and whether filtering is switched on.
 */
export function useLoganSearch(): UseLoganSearch {
  const filtersEnabled = useFeatureFlag(FEATURE_FLAGS.LOGAN_FILTERS);
  const filtering = useLoganFilters(filtersEnabled);
  const search = useKmindexSearch(filtering.query);

  // A filter belongs to the search it was picked on. Reattaching to ?job= on
  // load keeps the filter in the URL; moving to another job drops it.
  const { clear } = filtering;
  const lastJobRef = useRef(search.jobId);
  useEffect(() => {
    if (lastJobRef.current && lastJobRef.current !== search.jobId) clear();
    lastJobRef.current = search.jobId;
  }, [clear, search.jobId]);

  return { filtering, filtersEnabled, search };
}
