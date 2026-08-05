import { ENA_PORTAL_API_BASE_URL } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/constants";
import { ENA_FIELDS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/constants";
import { type QueryKey } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/query/types";
import { type QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";

/**
 * Fetches ENA sequencing data based on the provided taxonomy ID using React Query.
 *
 * @returns Data from the ENA endpoint.
 */
export function queryFn<T = unknown>(): (
  context: QueryFunctionContext<QueryKey>
) => Promise<T> {
  return ({ queryKey, signal }: QueryFunctionContext<QueryKey>) => {
    // The second element of the queryKey is the taxonomy ID.
    const { 1: taxonomyId } = queryKey;

    return ky(`${ENA_PORTAL_API_BASE_URL}/search`, {
      searchParams: {
        fields: ENA_FIELDS.join(","),
        format: "json",
        query: `tax_tree(${taxonomyId})`,
        result: "read_run",
      },
      signal,
    }).json<T>();
  };
}
