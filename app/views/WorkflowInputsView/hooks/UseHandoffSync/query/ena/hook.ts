import { BaseReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { useHandoffInputs } from "@/providers/workflowHandoff/hooks/UseHandoffInputs/hook";
import { EntityKey } from "@/providers/workflowHandoff/types";
import {
  DefaultError,
  UseQueryResult,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { queryFn } from "./options/queryFn";
import { QueryKey } from "./types";

/**
 * Fetch ENA read-run data for the handoff at this entity+path. Returns an
 * empty/no-op result when no accessions exist for the cell, so callers can
 * unconditionally call the hook from `useHandoffSync`.
 * @param entity - Entity key (e.g. `assemblies`).
 * @param path - Current page path.
 * @returns React Query result for the ENA read-run fetch.
 */
export const useHandoffEnaQuery = (
  entity: EntityKey,
  path: string
): UseQueryResult<BaseReadRun[]> => {
  const { accessions } = useHandoffInputs(entity, path);
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
