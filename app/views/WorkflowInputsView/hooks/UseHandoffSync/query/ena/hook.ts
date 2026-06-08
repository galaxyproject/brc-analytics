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
    // staleTime: Infinity keeps the resolved data warm for the lifetime of the
    // session, so the user doesn't see a re-fetch flicker if they revisit the
    // stepper. gcTime stays at the React Query default (~5 min after last
    // unmount) so distinct accession sets from prior assistant sessions don't
    // accumulate in cache for the whole tab lifetime.
    enabled: accessions.length > 0,
    queryFn: queryFn(),
    queryKey: ["AssistantHandoffEna", cacheKey],
    staleTime: Infinity,
  });
};
