import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { AppSiteConfig } from "../../../../../../../../../../../../../../../site-config/common/entities";
import { useWorkflowEntity } from "../../../../../../../../../../providers/WorkflowEntity/hook";
import { BaseReadRun } from "../types";
import { queryFn } from "./options/queryFn";
import { QueryKey } from "./types";
import { isEligible } from "./utils";

/**
 * Custom hook to fetch ENA sequencing data based on the workflow entity's taxonomy ID.
 *
 * @returns React Query result containing ENA sequencing data or an error.
 */
export const useQuery = (): UseQueryResult<BaseReadRun[]> => {
  const { config } = useConfig();
  const { ncbiTaxonomyId } = useWorkflowEntity() ?? {};
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
