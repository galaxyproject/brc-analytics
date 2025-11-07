import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { SubmitOptions } from "./types";
import { AccessionInfo } from "./entities";
import { ENA_FIELDS } from "./constants";

export const ENA_API = `${process.env.NEXT_PUBLIC_ENA_PROXY_DOMAIN}/ena/portal/api/search?result=read_run&query={query}&fields=${ENA_FIELDS.join(",")}&format=json`;

/**
 * Fetch ENA data for a given accession number.
 * @param options - Options for the ENA data fetch.
 * @param options.accessionsInfo - The accession numbers to fetch data for, along with types (e.g., experiment, run, sample, study).
 * @param options.submitOptions - Options for the submission.
 * @returns Promise with the ENA data.
 */
export async function fetchENAData<T>({
  accessionsInfo,
  submitOptions,
}: {
  accessionsInfo: AccessionInfo[];
  submitOptions: SubmitOptions<T>;
}): Promise<T[] | undefined> {
  const accessionsByType: Record<string, string[]> = {};
  for (const { accession, accessionType } of accessionsInfo) {
    (
      accessionsByType[accessionType] ?? (accessionsByType[accessionType] = [])
    ).push(accession);
  }
  const query = Object.entries(accessionsByType)
    .map(([accessionType, accessions]) => {
      return `${accessionType} IN (${accessions.join(",")})`;
    })
    .join(" OR ");

  const res = await fetch(replaceParameters(ENA_API, { query }));

  const data = await res.json();

  if (!data || !data.length) {
    submitOptions.onError?.(
      new Error(
        "Accessions were not found. Please check the IDs and try again."
      )
    );
    return;
  }

  submitOptions.onSuccess?.(data);

  return data;
}
