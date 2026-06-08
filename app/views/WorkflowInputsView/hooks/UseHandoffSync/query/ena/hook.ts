import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/router";
import { BaseReadRun } from "../../../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { extractAccessionsFromQuery } from "../../utils";
import { queryFn } from "./options/queryFn";
import { QueryKey } from "./types";

/**
 * Fetch ENA read-run data for handoff accessions. Driven by URL query params;
 * any component in the tree can call this hook to observe the same cached
 * query (React Query dedupes the actual fetch).
 * @returns React Query result for the ENA read-run fetch.
 */
export const useHandoffEnaQuery = (): UseQueryResult<BaseReadRun[]> => {
  const { query } = useRouter();
  const accessions = extractAccessionsFromQuery(query);

  return useReactQuery<BaseReadRun[], DefaultError, BaseReadRun[], QueryKey>({
    enabled: accessions.length > 0,
    gcTime: Infinity,
    queryFn: queryFn(),
    queryKey: ["AssistantHandoffEna", accessions.join(",")],
    staleTime: Infinity,
  });
};
