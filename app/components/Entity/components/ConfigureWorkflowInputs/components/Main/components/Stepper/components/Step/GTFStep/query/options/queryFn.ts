import { QueryKey } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/query/types";
import { QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";
import { UCSC_FILES_ENDPOINT } from "./constants";

/**
 * Fetches data from the UCSC files API using React Query.
 *
 * @returns Data from the UCSC endpoint.
 */
export function queryFn<T = unknown>(): (
  context: QueryFunctionContext<QueryKey>
) => Promise<T> {
  return ({ queryKey, signal }: QueryFunctionContext<QueryKey>) => {
    // The second element of the queryKey is the genome assembly ID.
    const { 1: genome } = queryKey;

    return ky(UCSC_FILES_ENDPOINT, {
      searchParams: { genome },
      signal,
    }).json<T>();
  };
}
