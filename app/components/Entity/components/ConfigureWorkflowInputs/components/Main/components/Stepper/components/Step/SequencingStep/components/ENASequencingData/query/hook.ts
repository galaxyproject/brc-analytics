import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { AppSiteConfig } from "../../../../../../../../../../../../../../../site-config/common/entities";
import { Assembly } from "../../../../../../../../../../../../../../views/WorkflowInputsView/types";
import { BaseReadRun } from "../types";
import { queryFn } from "./options/queryFn";
import { QueryKey } from "./types";
import { isEligible } from "./utils";

/**
 * Custom hook to fetch ENA sequencing data based on the provided taxonomy ID.
 *
 * @param genome - Genome.
 * @returns React Query result containing ENA sequencing data or an error.
 */
export const useQuery = (genome?: Assembly): UseQueryResult<BaseReadRun[]> => {
  const { config } = useConfig();
  const { ncbiTaxonomyId } = genome || {};
  const { maxReadRunsForBrowseAll } = config as AppSiteConfig;

  const enabled = isEligible(ncbiTaxonomyId, maxReadRunsForBrowseAll);

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

  return query;
};
