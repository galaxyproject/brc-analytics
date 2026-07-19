import { ENA_PORTAL_API_BASE_URL } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/constants";
import { QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";
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

    // Validate the response; throw on anything non-finite or negative so the
    // query is treated as an error (which falls back to the accession path)
    // rather than caching NaN/garbage.
    const parsedCount = Number(count);
    if (!Number.isFinite(parsedCount) || parsedCount < 0) {
      throw new Error(`Unexpected ENA read-run count response: ${count}`);
    }

    return parsedCount;
  };
}
