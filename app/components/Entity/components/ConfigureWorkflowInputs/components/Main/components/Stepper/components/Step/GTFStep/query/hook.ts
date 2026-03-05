import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { Assembly } from "../../../../../../../../../../../../views/WorkflowInputsView/types";
import { queryFn } from "./options/queryFn";
import { select } from "./options/select";
import { QueryKey } from "./types";
import { getAssemblyId } from "./utils";

/**
 * Custom hook to fetch GTF file URLs from the UCSC files API based on the provided genome assembly information.
 *
 * @param genome - Genome assembly information.
 * @returns React Query result containing an array of GTF file URLs or an error.
 */
export const useQuery = (genome?: Assembly): UseQueryResult<string[]> => {
  const assemblyId = getAssemblyId(genome);

  const query = useReactQuery<
    { urlList: { url: string }[] },
    DefaultError,
    string[],
    QueryKey
  >({
    enabled: Boolean(assemblyId),
    queryFn: queryFn(),
    queryKey: ["gtf", assemblyId],
    select,
  });

  return query;
};
