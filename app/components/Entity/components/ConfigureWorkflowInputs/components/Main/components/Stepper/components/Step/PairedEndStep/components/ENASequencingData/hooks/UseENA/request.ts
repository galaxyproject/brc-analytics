import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ENA_FIELDS } from "./constants";
import { SubmitOptions } from "./types";

const ENA_API = `https://brc-analytics.dev.clevercanary.com/ena/portal/api/search?result=read_run&query={accessionType}={accession}&fields=${ENA_FIELDS.join(",")}&format=json`;

/**
 * Fetch ENA data for a given accession number.
 * @param {Object} options - Options for the ENA data fetch.
 * @param {string} options.accession - The accession number to fetch data for.
 * @param {string} options.accessionType - The type of accession (e.g., experiment, run, sample, study).
 * @param {SubmitOptions} options.submitOptions - Options for the submission.
 * @returns Promise with the ENA data.
 */
export async function fetchENAData<T>({
  accession,
  accessionType,
  submitOptions,
}: {
  accession: string;
  accessionType: string;
  submitOptions: SubmitOptions;
}): Promise<T[] | undefined> {
  const res = await fetch(
    replaceParameters(ENA_API, { accession, accessionType })
  );

  const data = await res.json();

  if (!data || !data.length) {
    submitOptions.onError?.();
    return;
  }

  submitOptions.onSuccess?.();

  return data;
}
