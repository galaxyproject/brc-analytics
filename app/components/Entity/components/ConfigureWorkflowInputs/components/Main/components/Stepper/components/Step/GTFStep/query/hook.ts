import { Assembly } from "@/views/WorkflowInputsView/types";
import { queryFn } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/query/options/queryFn";
import { select } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/query/options/select";
import { QueryKey } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/query/types";
import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { getAssemblyId } from "./utils";

/**
 * Custom hook to fetch GTF file URLs from the UCSC files API based on the provided genome assembly information.
 *
 * @param genome - Genome assembly information.
 * @returns React Query result containing an array of GTF file URLs or an error.
 */
export const useQuery = (genome?: Assembly): UseQueryResult<string[]> => {
  const assemblyId = getAssemblyId(genome);
  const enabled = Boolean(assemblyId);

  const query = useReactQuery<
    { urlList: { url: string }[] },
    DefaultError,
    string[],
    QueryKey
  >({
    enabled,
    queryFn: queryFn(),
    queryKey: ["GTF", assemblyId],
    select,
  });

  return query;
};
