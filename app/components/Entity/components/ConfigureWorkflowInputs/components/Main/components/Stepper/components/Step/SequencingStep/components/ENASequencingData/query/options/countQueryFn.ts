import { QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";
import { ENA_PORTAL_API_BASE_URL } from "../../constants";
import { CountQueryKey } from "../types";

/**
 * Fetches the ENA read-run count for the given taxonomy ID via ENA's dedicated
 * /count endpoint, which returns the count as a server-side aggregate rather
 * than downloading the read-run rows.
 *
 * @returns The read-run count for the taxon subtree.
 */
export function countQueryFn(): (
  context: QueryFunctionContext<CountQueryKey>
) => Promise<number> {
  return async ({ queryKey, signal }: QueryFunctionContext<CountQueryKey>) => {
    // The second element of the queryKey is the taxonomy ID.
    const { 1: taxonomyId } = queryKey;

    const { count } = await ky(`${ENA_PORTAL_API_BASE_URL}/count`, {
      searchParams: {
        format: "json",
        query: `tax_tree(${taxonomyId})`,
        result: "read_run",
      },
      signal,
    }).json<{ count: string }>();

    return Number(count);
  };
}
