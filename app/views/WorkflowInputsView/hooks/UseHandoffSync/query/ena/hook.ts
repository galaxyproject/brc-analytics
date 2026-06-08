import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { BaseReadRun } from "../../../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { SOURCE_KEYS } from "../../../../state/constants";
import { useSourceState } from "../../../../state/hooks/UseSourceState/hook";
import { queryFn } from "./options/queryFn";
import { QueryKey } from "./types";

/**
 * Fetch ENA read-run data for handoff accessions. Driven by the assistant
 * handoff state; any component in the tree can call this hook to observe the
 * same cached query (React Query dedupes the actual fetch).
 * @returns React Query result for the ENA read-run fetch.
 */
export const useHandoffEnaQuery = (): UseQueryResult<BaseReadRun[]> => {
  const { accessions } = useSourceState(SOURCE_KEYS.ASSISTANT);
  // Sort to keep the cache key stable regardless of dispatch order.
  const cacheKey = [...accessions].sort().join(",");

  return useReactQuery<BaseReadRun[], DefaultError, BaseReadRun[], QueryKey>({
    enabled: accessions.length > 0,
    gcTime: Infinity,
    queryFn: queryFn(),
    queryKey: ["AssistantHandoffEna", cacheKey],
    staleTime: Infinity,
  });
};
