import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { AppSiteConfig } from "../../../../../../../../../../../../../../../site-config/common/entities";
import { useWorkflowEntity } from "../../../../../../../../../../providers/WorkflowEntity/hook";
import { BaseReadRun } from "../types";
import { countQueryFn } from "./options/countQueryFn";
import { queryFn } from "./options/queryFn";
import { CountQueryKey, QueryKey } from "./types";
import { isEligible } from "./utils";

/**
 * Custom hook to fetch ENA sequencing data for the workflow entity's taxonomy ID.
 *
 * The read-run count is fetched live from ENA when the stepper loads; the read
 * runs themselves are only pre-fetched when that count is under the browse-all
 * cap. Otherwise the user enters accessions at the ENA picker step.
 *
 * @returns React Query result containing ENA sequencing data or an error.
 */
export const useQuery = (): UseQueryResult<BaseReadRun[]> => {
  const { config } = useConfig();
  const { ncbiTaxonomyId } = useWorkflowEntity() ?? {};
  const { maxReadRunsForBrowseAll } = config as AppSiteConfig;

  // Live read-run count from ENA, replacing the precomputed
  // taxonomy_read_counts.json lookup. On error we don't retry — the count is
  // just a gate, so a failure falls back to the "Enter Accession(s)" path.
  const countQuery = useReactQuery<number, DefaultError, number, CountQueryKey>(
    {
      enabled: Boolean(ncbiTaxonomyId),
      queryFn: countQueryFn(),
      queryKey: ["ReadRunCountByTaxonomyId", ncbiTaxonomyId],
      retry: false,
    }
  );

  // Only pre-fetch the read runs when the live count is known and under the
  // browse-all cap. If the count errors, its data is undefined, so isEligible
  // returns false and the picker shows only "Enter Accession(s)".
  const enabled = isEligible(countQuery.data, maxReadRunsForBrowseAll);

  const query = useReactQuery<
    BaseReadRun[],
    DefaultError,
    BaseReadRun[],
    QueryKey
  >({
    enabled,
    queryFn: queryFn(),
    queryKey: ["ReadRunsByTaxonomyId", ncbiTaxonomyId],
  });

  // Treat the count fetch as part of loading, so the picker shows a spinner
  // while the count resolves rather than briefly flashing the accession-only UI.
  return {
    ...query,
    isLoading: countQuery.isLoading || query.isLoading,
  } as UseQueryResult<BaseReadRun[]>;
};
