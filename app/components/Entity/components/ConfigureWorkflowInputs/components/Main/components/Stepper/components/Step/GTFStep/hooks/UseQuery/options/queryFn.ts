import { QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";
import { QueryKey } from "../types";
import { UCSC_FILES_ENDPOINT } from "./constants";

/**
 * Fetches data from the Azul API using React Query.
 *
 * @returns Data from the Azul endpoint.
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
