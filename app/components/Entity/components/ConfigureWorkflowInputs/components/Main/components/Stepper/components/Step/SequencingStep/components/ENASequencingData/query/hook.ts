import {
  CountQueryKey,
  QueryKey,
} from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/query/types";
import { isEligible } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/query/utils";
import { useWorkflowEntity } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { AppSiteConfig } from "@site-config/common/entities";
import { DefaultError, useQuery as useReactQuery } from "@tanstack/react-query";
import { BaseReadRun, ENAReadRunsQuery } from "../types";
import { countQueryFn } from "./options/countQueryFn";
import { queryFn } from "./options/queryFn";

/**
 * Custom hook to fetch ENA sequencing data for the workflow entity's taxonomy ID.
 *
 * The read-run count is fetched live from ENA when the stepper loads; the read
 * runs themselves are only pre-fetched when that count is under the browse-all
 * cap. Otherwise the user enters accessions at the ENA picker step.
 *
 * @returns The fields of the read-run query the picker consumes; `isLoading`
 * covers both the count fetch and the read-run download.
 */
export const useQuery = (): ENAReadRunsQuery => {
  const { config } = useConfig();
  const { ncbiTaxonomyId } = useWorkflowEntity() ?? {};
  const { maxReadRunsForBrowseAll } = config as AppSiteConfig;

  // Live read-run count from ENA. On error we don't retry — the count is
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

  // Return only the fields the picker reads. isLoading folds in the count fetch
  // so the picker shows a spinner while the count resolves rather than briefly
  // flashing the accession-only UI.
  return {
    data: query.data,
    isEnabled: query.isEnabled,
    isLoading: countQuery.isLoading || query.isLoading,
    isSuccess: query.isSuccess,
  };
};
