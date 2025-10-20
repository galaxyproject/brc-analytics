import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { SubmitOptions } from "./types";
import { ENA_API } from "../UseENADataByAccession/request";

/**
 * Fetch ENA data for a given taxonomy ID.
 * @param options - Options for the ENA data fetch.
 * @param options.submitOptions - Options for the submission.
 * @param options.taxonomyId - The taxonomy ID to fetch data for.
 * @returns Promise with the ENA data.
 */
export async function fetchENAData<T>({
  submitOptions,
  taxonomyId,
}: {
  submitOptions: Required<SubmitOptions<T>>;
  taxonomyId: string;
}): Promise<T[] | undefined> {
  try {
    const queryStr = `tax_tree(${taxonomyId})`;
    const query = encodeURI(queryStr);

    const res = await fetch(replaceParameters(ENA_API, { query }));

    if (!res.ok) {
      const errorMessage = `ENA API request failed: ${res.status} ${res.statusText}`;
      submitOptions.onError?.(new Error(errorMessage));
      return;
    }

    const data = await res.json();

    if (!data) {
      const errorMessage = `No sequencing data found for taxonomy ID ${taxonomyId}`;
      submitOptions.onError?.(new Error(errorMessage));
      return;
    }

    submitOptions.onSuccess?.(data);

    return data;
  } catch (error) {
    submitOptions.onError?.(error as Error);
    return;
  }
}
